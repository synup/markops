#!/usr/bin/env python3
"""
Generate content briefs for approved call_insights.
Phase 3b of the Content Intelligence Workflow.

For each content_briefs row with status='pending' (oldest first), respecting
exponential backoff on retry_count:
  1. Claim the row by PATCHing status='generating' (conditional on status=pending
     so concurrent workers cannot double-pick).
  2. Fetch the linked call_insight + sales_call (customer name/company, problem
     statement, marketing summary, verbatim quotes, asset rationale, author).
  3. Compose system prompt = base.md + brief_prompts/<asset_type>.md.
  4. Call Claude Sonnet 4.6 with the call context as user message.
  5. PATCH brief_content, prompt_used, model_version, generation_metadata,
     ready_at, status='ready' on success. On failure, increment retry_count,
     set error_message, and either drop back to 'pending' (retryable, subject
     to the backoff window before next pickup) or 'failed' (terminal).

Retry policy:
  retry_count=0  first attempt, eligible immediately
  retry_count=1  retry 1, eligible 1 minute after prior failure
  retry_count=2  retry 2, eligible 5 minutes after prior failure
  retry_count=3  retry 3, eligible 15 minutes after prior failure
  retry_count=4  no further retries — status flips to 'failed' (terminal)

Per-run caps:
  - At most MAX_PER_RUN (=10) candidates fetched.
  - Briefs processed sequentially (concurrency=1).

Usage:
  python process_content_briefs.py [--dry-run] [--max-briefs N] [--brief-id UUID]

Requires env vars:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  ANTHROPIC_API_KEY
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


# ─── constants ────────────────────────────────────────────────────────
HTTP_TIMEOUT_S    = 60
CLAUDE_TIMEOUT_S  = 300
POLITE_DELAY_S    = 1.0
MAX_PER_RUN       = 10
MAX_RETRIES       = 3

# Backoff (seconds) before a row with the given retry_count is eligible for
# pickup. Tuple index = retry_count. After all retries are exhausted the row
# transitions to 'failed' (terminal).
RETRY_BACKOFF_S   = (0, 60, 300, 900)  # retry_count: 0=initial, 1=1m, 2=5m, 3=15m

ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
ANTHROPIC_VERSION = '2023-06-01'
MODEL_ID          = 'claude-sonnet-4-6'
MAX_TOKENS        = 8192

VALID_ASSET_TYPES = ('blog_post', 'deep_article', 'use_case', 'collateral', 'tool')

SCRIPT_DIR        = os.path.dirname(os.path.abspath(__file__))
PROMPTS_DIR       = os.environ.get(
    'BRIEF_PROMPTS_DIR',
    os.path.join(SCRIPT_DIR, 'brief_prompts'),
)

SUPABASE_URL              = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
ANTHROPIC_API_KEY         = os.environ.get('ANTHROPIC_API_KEY', '')

CODE_FENCE_RE = re.compile(r'^```(?:markdown|md)?\s*\n(.*)\n```\s*$', re.DOTALL)


# ─── exceptions (clean abort vs continue) ─────────────────────────────
class AuthError(Exception):
    """401 from Anthropic — abort the run."""


class RateLimitError(Exception):
    """429 — abort the run."""


class FetchError(Exception):
    """Per-brief failure fetching joined call_insight / sales_call — skip."""


class GenerationError(Exception):
    """Per-brief failure in Claude call / parse / DB write — skip this brief."""


# ─── logging ──────────────────────────────────────────────────────────
def log(level, event, **fields):
    """Stdout key=value structured log line."""
    parts = [level, f'event={event}']
    for k, v in fields.items():
        if v is None:
            parts.append(f'{k}=null')
        elif isinstance(v, str):
            parts.append(f'{k}={json.dumps(v)}')
        else:
            parts.append(f'{k}={v}')
    print(' '.join(parts), flush=True)


# ─── CLI ──────────────────────────────────────────────────────────────
def parse_args():
    p = argparse.ArgumentParser(
        description='Generate content briefs for approved call_insights.',
    )
    p.add_argument(
        '--dry-run', action='store_true',
        help='Build the prompt and call Claude (costs apply), but do not '
             'claim the row or write the result. Prints the generated brief '
             'to stdout.',
    )
    p.add_argument(
        '--max-briefs', type=int, default=None, metavar='N',
        help='Process at most N briefs this run.',
    )
    p.add_argument(
        '--brief-id', type=str, default=None, metavar='UUID',
        help='Process a single specific brief (ignores status filter; useful '
             'for debugging or manual re-runs).',
    )
    return p.parse_args()


# ─── Supabase HTTP helpers ────────────────────────────────────────────
def _supabase_headers(extra=None):
    h = {
        'apikey':        SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
    }
    if extra:
        h.update(extra)
    return h


def _read_body(e):
    try:
        return e.read().decode() if e.fp else ''
    except Exception:
        return ''


# ─── prompt loaders ───────────────────────────────────────────────────
def load_base_prompt():
    path = os.path.join(PROMPTS_DIR, 'base.md')
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def load_asset_prompt(asset_type):
    if asset_type not in VALID_ASSET_TYPES:
        raise GenerationError(f'invalid_asset_type value={asset_type!r}')
    path = os.path.join(PROMPTS_DIR, f'{asset_type}.md')
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except OSError as e:
        raise GenerationError(f'asset_prompt_load_failed path={path!r} detail={e!r}') from e


# ─── Supabase reads ───────────────────────────────────────────────────
def _backoff_filter():
    """Return the PostgREST `or=(...)` clause that selects rows whose
    retry_count is <= MAX_RETRIES AND whose updated_at is older than the
    bucket's backoff window. Cutoff timestamps are computed client-side so
    the filter is a plain comparison against literal ISO timestamps.
    """
    now = datetime.now(timezone.utc)
    parts = []
    for rc, secs in enumerate(RETRY_BACKOFF_S):
        if rc > MAX_RETRIES:
            break
        if secs <= 0:
            parts.append(f'retry_count.eq.{rc}')
        else:
            cutoff = (now - timedelta(seconds=secs)).isoformat()
            parts.append(f'and(retry_count.eq.{rc},updated_at.lte.{cutoff})')
    return f'or=({",".join(parts)})'


def fetch_pending_briefs(limit, brief_id=None):
    """GET content_briefs — pending rows eligible per backoff policy, oldest
    first (or a specific id, bypassing the filter)."""
    base = f'{SUPABASE_URL}/rest/v1/content_briefs'
    params = [
        ('select', 'id,call_insight_id,asset_type,status,retry_count,created_at,updated_at'),
        ('limit',  str(limit)),
    ]
    if brief_id:
        params.append(('id', f'eq.{brief_id}'))
        url = f'{base}?{urlencode(params)}'
    else:
        params.append(('status', 'eq.pending'))
        params.append(('order',  'created_at.asc'))
        # urlencode the simple params, then append the or=(...) clause
        # raw to avoid percent-encoding the parens/dots/commas PostgREST needs.
        url = f'{base}?{urlencode(params)}&{_backoff_filter()}'

    req = Request(url, headers=_supabase_headers())
    try:
        with urlopen(req, timeout=HTTP_TIMEOUT_S) as resp:
            return json.loads(resp.read().decode())
    except HTTPError as e:
        raise FetchError(
            f'fetch_briefs_failed http_status={e.code} detail={_read_body(e)[:300]!r}'
        ) from e
    except URLError as e:
        raise FetchError(f'fetch_briefs_url_error={e.reason!r}') from e


def fetch_call_context(call_insight_id):
    """GET call_insights row + embedded sales_calls (the source conversation)."""
    select = (
        'id,call_id,marketing_summary,customer_verbatim,problem_statement,'
        'asset_rationale,approved_asset_type,suggested_asset_type,'
        'suggested_author,composite_score,icp_fit_score,problem_clarity_score,'
        'reusability_score,novelty_score,problem_specificity_score,'
        'attribution_category,attribution_detail,'
        'sales_calls!call_id(id,title,call_date,rep_name,customer_name,'
        'customer_company,customer_email,conversation_type,pipeline)'
    )
    url = (
        f'{SUPABASE_URL}/rest/v1/call_insights'
        f'?id=eq.{quote(call_insight_id, safe="")}'
        f'&select={quote(select, safe=",!()")}'
    )
    req = Request(url, headers=_supabase_headers())
    try:
        with urlopen(req, timeout=HTTP_TIMEOUT_S) as resp:
            rows = json.loads(resp.read().decode())
    except HTTPError as e:
        raise FetchError(
            f'fetch_call_context_failed http_status={e.code} detail={_read_body(e)[:300]!r}'
        ) from e
    except URLError as e:
        raise FetchError(f'fetch_call_context_url_error={e.reason!r}') from e

    if not rows:
        raise FetchError(f'call_insight_not_found id={call_insight_id!r}')
    return rows[0]


# ─── Supabase writes ──────────────────────────────────────────────────
def claim_brief(brief_id):
    """PATCH status pending→generating. Returns True if we claimed the row,
    False if another worker beat us to it (or the row is no longer pending)."""
    payload = {'status': 'generating'}
    url = (
        f'{SUPABASE_URL}/rest/v1/content_briefs'
        f'?id=eq.{quote(brief_id, safe="")}'
        f'&status=eq.pending'
    )
    headers = _supabase_headers({
        'Content-Type': 'application/json',
        'Prefer':       'return=representation',
    })
    body = json.dumps(payload).encode()
    req  = Request(url, data=body, headers=headers, method='PATCH')
    try:
        with urlopen(req, timeout=HTTP_TIMEOUT_S) as resp:
            rows = json.loads(resp.read().decode())
    except HTTPError as e:
        raise GenerationError(
            f'claim_failed http_status={e.code} detail={_read_body(e)[:300]!r}'
        ) from e
    except URLError as e:
        raise GenerationError(f'claim_url_error={e.reason!r}') from e

    return bool(rows)


def write_success(brief_id, brief_content, prompt_used, metadata):
    """PATCH brief row with successful generation output."""
    payload = {
        'status':              'ready',
        'brief_content':       brief_content,
        'prompt_used':         prompt_used,
        'model_version':       MODEL_ID,
        'generation_metadata': metadata,
        'ready_at':            datetime.now(timezone.utc).isoformat(),
        'error_message':       None,
    }
    _patch_brief(brief_id, payload, 'write_success_failed')


def write_failure(brief_id, error_message, next_status, retry_count):
    """PATCH brief row with failure metadata. next_status is 'pending' if
    retryable (retry_count < MAX_RETRIES) else 'failed'."""
    payload = {
        'status':        next_status,
        'error_message': error_message[:1000],
        'retry_count':   retry_count,
    }
    _patch_brief(brief_id, payload, 'write_failure_failed')


def _patch_brief(brief_id, payload, error_event):
    url = (
        f'{SUPABASE_URL}/rest/v1/content_briefs'
        f'?id=eq.{quote(brief_id, safe="")}'
    )
    headers = _supabase_headers({
        'Content-Type': 'application/json',
        'Prefer':       'return=minimal',
    })
    body = json.dumps(payload).encode()
    req  = Request(url, data=body, headers=headers, method='PATCH')
    try:
        with urlopen(req, timeout=HTTP_TIMEOUT_S) as resp:
            resp.read()
    except HTTPError as e:
        # write failures are logged but do not abort the run — the row will
        # remain in 'generating' and require manual reset.
        log('error', error_event,
            brief_id=brief_id,
            http_status=e.code,
            detail=_read_body(e)[:300])
    except URLError as e:
        log('error', error_event, brief_id=brief_id, detail=repr(e))


# ─── Anthropic call ───────────────────────────────────────────────────
def build_system_prompt(asset_type):
    base  = load_base_prompt()
    asset = load_asset_prompt(asset_type)
    return f'{base}\n\n---\n\n{asset}'


def build_user_message(context):
    """Render call_insight + sales_call as the source material for the brief."""
    sales_call = context.get('sales_calls') or {}
    verbatim   = context.get('customer_verbatim')
    if isinstance(verbatim, (dict, list)):
        verbatim_str = json.dumps(verbatim, indent=2, ensure_ascii=False)
    elif verbatim:
        verbatim_str = str(verbatim)
    else:
        verbatim_str = '(none captured)'

    approved   = context.get('approved_asset_type') or context.get('suggested_asset_type')
    author     = context.get('suggested_author') or '(unassigned)'
    attribution_bits = []
    if context.get('attribution_category'):
        attribution_bits.append(context['attribution_category'])
    if context.get('attribution_detail'):
        attribution_bits.append(context['attribution_detail'])
    attribution = ' / '.join(attribution_bits) or '(none)'

    scores = (
        f"composite={context.get('composite_score')}/25 "
        f"icp_fit={context.get('icp_fit_score')} "
        f"problem_clarity={context.get('problem_clarity_score')} "
        f"problem_specificity={context.get('problem_specificity_score')} "
        f"reusability={context.get('reusability_score')} "
        f"novelty={context.get('novelty_score')}"
    )

    return (
        'You are generating a content brief from a single customer conversation.\n'
        'Use the source material below to ground the brief in real customer '
        'language and concrete problem context.\n\n'
        '## Source conversation\n'
        f'- Meeting title: {sales_call.get("title") or "(none)"}\n'
        f'- Date: {sales_call.get("call_date") or "(unknown)"}\n'
        f'- Rep: {sales_call.get("rep_name") or "(unknown)"}\n'
        f'- Customer: {sales_call.get("customer_name") or "(unknown)"} '
        f'at {sales_call.get("customer_company") or "(unknown company)"}\n'
        f'- Conversation type: {sales_call.get("conversation_type") or "(unknown)"} '
        f'({sales_call.get("pipeline") or "no pipeline"})\n'
        f'- Attribution: {attribution}\n\n'
        '## Approved asset type\n'
        f'{approved}\n\n'
        '## Suggested author\n'
        f'{author}\n\n'
        '## Insight scores\n'
        f'{scores}\n\n'
        '## Problem statement (extracted)\n'
        f'{context.get("problem_statement") or "(none)"}\n\n'
        '## Marketing summary (extracted)\n'
        f'{context.get("marketing_summary") or "(none)"}\n\n'
        '## Asset rationale (why this asset type was chosen)\n'
        f'{context.get("asset_rationale") or "(none)"}\n\n'
        '## Customer verbatim quotes\n'
        f'{verbatim_str}\n\n'
        '---\n'
        'Now generate the brief in the exact structure specified for this '
        'asset type. Output markdown only — no preamble, no trailing '
        'commentary, no code fence around the whole document.'
    )


def call_claude(system_prompt, user_message):
    """POST /v1/messages. One 5s-delay retry on URLError / 5xx.

    Raises:
      AuthError         on 401 (abort run)
      RateLimitError    on 429 (abort run)
      GenerationError   on other failures (skip brief)

    Returns the parsed API response dict.
    """
    payload = {
        'model':      MODEL_ID,
        'max_tokens': MAX_TOKENS,
        'system':     system_prompt,
        'messages':   [{'role': 'user', 'content': user_message}],
    }
    headers = {
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
        'content-type':      'application/json',
    }
    body = json.dumps(payload).encode()

    last_err = None
    for attempt in (1, 2):
        req = Request(ANTHROPIC_API_URL, data=body, headers=headers, method='POST')
        try:
            with urlopen(req, timeout=CLAUDE_TIMEOUT_S) as resp:
                return json.loads(resp.read().decode())
        except HTTPError as e:
            detail = _read_body(e)
            if e.code == 401:
                raise AuthError(f'anthropic_401 detail={detail[:200]!r}') from e
            if e.code == 429:
                raise RateLimitError(f'anthropic_429 detail={detail[:200]!r}') from e
            if 500 <= e.code < 600 and attempt == 1:
                last_err = f'http_status={e.code} detail={detail[:200]!r}'
                time.sleep(5)
                continue
            raise GenerationError(
                f'anthropic_http_status={e.code} detail={detail[:200]!r}'
            ) from e
        except URLError as e:
            if attempt == 1:
                last_err = f'url_error={e.reason!r}'
                time.sleep(5)
                continue
            raise GenerationError(f'anthropic_url_error={e.reason!r}') from e

    raise GenerationError(f'anthropic_unreachable last_err={last_err!r}')


def parse_brief(api_response):
    """Pull text content from messages API response, strip any stray code
    fences (the prompt forbids them, but be defensive)."""
    content_blocks = api_response.get('content') or []
    text_parts = [b.get('text', '') for b in content_blocks if b.get('type') == 'text']
    text = ''.join(text_parts).strip()
    if not text:
        raise GenerationError('empty_response_text')
    m = CODE_FENCE_RE.match(text)
    if m:
        text = m.group(1).strip()
    return text


def extract_metadata(api_response, system_prompt, user_message, latency_ms):
    usage = api_response.get('usage') or {}
    return {
        'input_tokens':         usage.get('input_tokens'),
        'output_tokens':        usage.get('output_tokens'),
        'cache_read_tokens':    usage.get('cache_read_input_tokens'),
        'cache_creation_tokens': usage.get('cache_creation_input_tokens'),
        'stop_reason':          api_response.get('stop_reason'),
        'latency_ms':           latency_ms,
        'system_prompt_chars':  len(system_prompt),
        'user_message_chars':   len(user_message),
    }


# ─── orchestration ────────────────────────────────────────────────────
def process_one_brief(brief, dry_run):
    """Return 'processed' | 'skipped' | 'failed' | 'lost_claim'.

    AuthError / RateLimitError propagate to caller (abort run).
    """
    brief_id      = brief['id']
    asset_type    = brief['asset_type']
    insight_id    = brief['call_insight_id']
    retry_count   = brief.get('retry_count') or 0

    # 1. Load joined context first (cheap read; if it fails, no point claiming).
    try:
        context = fetch_call_context(insight_id)
    except FetchError as e:
        log('error', 'context_fetch_failed',
            brief_id=brief_id, call_insight_id=insight_id, detail=str(e)[:300])
        new_retry = retry_count + 1
        next_status = 'pending' if new_retry <= MAX_RETRIES else 'failed'
        if not dry_run:
            write_failure(brief_id, f'context_fetch: {e}', next_status, new_retry)
        return 'failed'

    # 2. Build prompts (also fails fast if asset_type or prompt file is bad).
    try:
        system_prompt = build_system_prompt(asset_type)
    except GenerationError as e:
        log('error', 'prompt_build_failed',
            brief_id=brief_id, asset_type=asset_type, detail=str(e)[:300])
        new_retry = retry_count + 1
        # Prompt build failures are not transient — go straight to 'failed'.
        if not dry_run:
            write_failure(brief_id, f'prompt_build: {e}', 'failed', new_retry)
        return 'failed'

    user_message = build_user_message(context)

    # 3. Claim the row (skip if dry-run; skip if another worker beat us).
    if not dry_run:
        try:
            if not claim_brief(brief_id):
                log('info', 'claim_lost', brief_id=brief_id)
                return 'lost_claim'
        except GenerationError as e:
            log('error', 'claim_error',
                brief_id=brief_id, detail=str(e)[:300])
            return 'failed'

    # 4. Call Claude.
    log('info', 'calling_claude',
        brief_id=brief_id, asset_type=asset_type,
        call_insight_id=insight_id,
        system_prompt_chars=len(system_prompt),
        user_message_chars=len(user_message))

    started = time.monotonic()
    try:
        api_response   = call_claude(system_prompt, user_message)
        brief_content  = parse_brief(api_response)
    except GenerationError as e:
        log('error', 'generation_failed',
            brief_id=brief_id, detail=str(e)[:300])
        new_retry = retry_count + 1
        next_status = 'pending' if new_retry <= MAX_RETRIES else 'failed'
        if not dry_run:
            write_failure(brief_id, f'generation: {e}', next_status, new_retry)
        return 'failed'

    latency_ms = int((time.monotonic() - started) * 1000)
    metadata   = extract_metadata(api_response, system_prompt, user_message, latency_ms)
    prompt_used = f'SYSTEM:\n{system_prompt}\n\n---\n\nUSER:\n{user_message}'

    if dry_run:
        print(json.dumps({
            'brief_id':        brief_id,
            'asset_type':      asset_type,
            'call_insight_id': insight_id,
            'metadata':        metadata,
            'brief_preview':   brief_content[:1200],
            'brief_length':    len(brief_content),
        }, indent=2, ensure_ascii=False), flush=True)
        return 'processed'

    write_success(brief_id, brief_content, prompt_used, metadata)
    log('info', 'brief_ready',
        brief_id=brief_id, asset_type=asset_type,
        brief_chars=len(brief_content),
        latency_ms=latency_ms,
        output_tokens=metadata.get('output_tokens'))
    return 'processed'


# ─── entry point ──────────────────────────────────────────────────────
def main():
    args = parse_args()

    missing = [
        name for name, val in [
            ('SUPABASE_URL',              SUPABASE_URL),
            ('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY),
            ('ANTHROPIC_API_KEY',         ANTHROPIC_API_KEY),
        ] if not val
    ]
    if missing:
        log('error', 'missing_env_vars', vars=','.join(missing))
        return 1

    if not os.path.isdir(PROMPTS_DIR):
        log('error', 'prompts_dir_missing', path=PROMPTS_DIR)
        return 1

    # Sanity check: base.md must exist (asset prompts loaded lazily per brief).
    try:
        load_base_prompt()
    except OSError as e:
        log('error', 'base_prompt_load_failed',
            path=os.path.join(PROMPTS_DIR, 'base.md'), detail=repr(e))
        return 1

    start = time.monotonic()
    log('info', 'process_content_briefs_started',
        dry_run=args.dry_run,
        max_briefs=args.max_briefs,
        brief_id=args.brief_id,
        model=MODEL_ID,
        prompts_dir=PROMPTS_DIR)

    fetch_limit = min(args.max_briefs, MAX_PER_RUN) if args.max_briefs else MAX_PER_RUN

    try:
        briefs = fetch_pending_briefs(fetch_limit, args.brief_id)
    except FetchError as e:
        log('error', 'fetch_briefs_failed', detail=str(e)[:500])
        return 1

    log('info', 'fetched_candidates', count=len(briefs))

    counters = {'processed': 0, 'failed': 0, 'lost_claim': 0}
    exit_code = 0

    try:
        for i, brief in enumerate(briefs):
            result = process_one_brief(brief, args.dry_run)
            counters[result] = counters.get(result, 0) + 1
            if i < len(briefs) - 1:
                time.sleep(POLITE_DELAY_S)
    except AuthError as e:
        log('error', 'auth_failed', detail=str(e)[:500])
        exit_code = 1
    except RateLimitError as e:
        log('error', 'rate_limited', detail=str(e)[:500])
        exit_code = 1

    duration_s = round(time.monotonic() - start, 1)
    log('info', 'process_content_briefs_completed',
        candidates=len(briefs),
        processed=counters['processed'],
        failed=counters['failed'],
        lost_claim=counters['lost_claim'],
        duration_s=duration_s,
        dry_run=args.dry_run)

    return exit_code


if __name__ == '__main__':
    sys.exit(main())
