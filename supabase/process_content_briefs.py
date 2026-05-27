#!/usr/bin/env python3
"""
Generate content briefs for approved call_insights.
Phase 3b of the Content Intelligence Workflow.

Prompts loaded from content_brief_prompts table (Supabase) as of migration 019.
Disk files in brief_prompts/ retained as seed-source reference only — no longer
read at runtime. Edits to the table (via SQL today, via UI after Phase 3b.5 item 4)
take effect on the next cron run since prompts are cached only per-invocation.

For each content_briefs row with status='pending' (oldest first):
  1. Claim the row by PATCHing status='generating' (conditional on status=pending
     so concurrent workers cannot double-pick).
  2. Fetch the linked call_insight + sales_call (customer name/company, problem
     statement, marketing summary, verbatim quotes, asset rationale, author).
  3. Compose system prompt = base + <asset_type> rows from content_brief_prompts.
  4. Call Claude Sonnet 4.6 with the call context as user message, with up to
     MAX_ATTEMPTS inline retries on transient generation failures.
  5. PATCH brief_content, prompt_used, model_version, generation_metadata,
     ready_at, status='ready' on success. After MAX_ATTEMPTS failures, set
     status='failed' with error_message and move on to the next candidate.

Retry policy (inline within a single invocation — no cross-run backoff):
  Attempt 1: immediate
  Attempt 2: after 30s wait
  Attempt 3: after 60s wait
  After attempt 3 fails: status='failed' (terminal), move to next brief.

Worst case ~90s of inline wait + 3x Claude call latency per failing brief.
That cost is bounded per brief so a bad row cannot freeze the queue or cause
overlapping cron runs.

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
from datetime import datetime, timezone
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


# ─── constants ────────────────────────────────────────────────────────
HTTP_TIMEOUT_S    = 60
CLAUDE_TIMEOUT_S  = 300
POLITE_DELAY_S    = 1.0
MAX_PER_RUN       = 10
MAX_ATTEMPTS      = 3

# Wait (seconds) BEFORE attempt N within a single invocation. Tuple index = N-1.
# Attempt 1 is immediate; attempt 2 waits 30s; attempt 3 waits 60s.
# Worst case ~90s of inline wait per failing brief.
RETRY_BACKOFF_S   = (0, 30, 60)

ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
ANTHROPIC_VERSION = '2023-06-01'
MODEL_ID          = 'claude-sonnet-4-6'
MAX_TOKENS        = 8192

VALID_ASSET_TYPES = ('blog_post', 'deep_article', 'use_case', 'collateral', 'tool')
VALID_PROMPT_NAMES = ('base',) + VALID_ASSET_TYPES

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
    """Per-brief transient fetch failure (joined call_insight / sales_call,
    or transient prompt fetch) — inline-retried up to MAX_ATTEMPTS."""


class PromptNotFoundError(Exception):
    """Requested prompt row missing from content_brief_prompts — config
    issue, not transient. Treated as TERMINAL failure for the brief."""


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


# ─── prompt loader (DB-backed, per-invocation cache) ──────────────────
# Cache lives only for one cron run. Next run picks up any prompt edits made
# in the table between invocations. Acceptable staleness window: ≤ 2 minutes
# (matches cron cadence) plus the in-flight run's remaining briefs.
_prompt_cache: dict = {}


def get_prompt(name: str) -> str:
    """Fetch a prompt row's content from content_brief_prompts, with cache.

    Raises:
      PromptNotFoundError  row missing for `name` — TERMINAL for the brief.
      FetchError           HTTP/network failure — caller should inline-retry.
    """
    cached = _prompt_cache.get(name)
    if cached is not None:
        return cached

    url = (
        f'{SUPABASE_URL}/rest/v1/content_brief_prompts'
        f'?prompt_name=eq.{quote(name, safe="")}'
        f'&select=prompt_content'
    )
    req = Request(url, headers=_supabase_headers())
    try:
        with urlopen(req, timeout=HTTP_TIMEOUT_S) as resp:
            rows = json.loads(resp.read().decode())
    except HTTPError as e:
        raise FetchError(
            f'prompt_fetch_failed name={name!r} http_status={e.code} '
            f'detail={_read_body(e)[:300]!r}'
        ) from e
    except URLError as e:
        raise FetchError(f'prompt_fetch_url_error name={name!r} reason={e.reason!r}') from e

    if not rows:
        raise PromptNotFoundError(
            f"Prompt {name!r} missing from content_brief_prompts table — check seed"
        )
    content = rows[0].get('prompt_content')
    if not content:
        raise PromptNotFoundError(
            f"Prompt {name!r} has empty prompt_content"
        )
    _prompt_cache[name] = content
    return content


# ─── Supabase reads ───────────────────────────────────────────────────
def fetch_pending_briefs(limit, brief_id=None):
    """GET content_briefs — pending rows oldest first (or a specific id)."""
    params = [
        ('select', 'id,call_insight_id,asset_type,status,retry_count,created_at'),
        ('limit',  str(limit)),
    ]
    if brief_id:
        params.append(('id', f'eq.{brief_id}'))
    else:
        params.append(('status', 'eq.pending'))
        params.append(('order',  'created_at.asc'))

    url = f'{SUPABASE_URL}/rest/v1/content_briefs?{urlencode(params)}'
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


def write_terminal_failure(brief_id, error_message):
    """PATCH brief row with status='failed' after MAX_ATTEMPTS exhausted."""
    payload = {
        'status':        'failed',
        'error_message': error_message[:1000],
        'retry_count':   MAX_ATTEMPTS,
    }
    _patch_brief(brief_id, payload, 'write_failure_failed')


def write_attempt_progress(brief_id, attempt, error_message):
    """PATCH retry_count + error_message between inline retry attempts so
    observers see progress while the worker is still trying."""
    payload = {
        'retry_count':   attempt,
        'error_message': error_message[:1000],
    }
    _patch_brief(brief_id, payload, 'write_attempt_progress_failed')


def release_brief(brief_id, error_message):
    """Drop a claimed row back to 'pending' without consuming retry budget.
    Used when an infra-level failure (Anthropic 401/429) aborts the run."""
    payload = {
        'status':        'pending',
        'error_message': error_message[:1000],
    }
    _patch_brief(brief_id, payload, 'release_brief_failed')


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
    """Concatenate the 'base' prompt + the asset-type-specific prompt from
    content_brief_prompts. Propagates PromptNotFoundError (terminal) and
    FetchError (transient) to the caller for handling."""
    base  = get_prompt('base')
    asset = get_prompt(asset_type)
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
    """Return 'processed' | 'failed' | 'lost_claim'.

    AuthError / RateLimitError propagate to caller (abort run); the claimed
    row is released back to 'pending' first so it can be picked up later.
    """
    brief_id   = brief['id']
    asset_type = brief['asset_type']
    insight_id = brief['call_insight_id']

    # 1. Pre-validate asset_type (pure local check, no DB). Terminal if
    #    invalid — no point claiming a row we cannot route to a prompt.
    if asset_type not in VALID_ASSET_TYPES:
        log('error', 'invalid_asset_type',
            brief_id=brief_id, asset_type=asset_type)
        if not dry_run:
            write_terminal_failure(brief_id, f'invalid_asset_type: {asset_type!r}')
        return 'failed'

    # 2. Claim the row.
    if not dry_run:
        try:
            if not claim_brief(brief_id):
                log('info', 'claim_lost', brief_id=brief_id)
                return 'lost_claim'
        except GenerationError as e:
            log('error', 'claim_error', brief_id=brief_id, detail=str(e)[:300])
            return 'failed'

    # 3. Inline retry loop: prompt fetch + context fetch + Claude call + parse.
    #    Prompt fetch is inside the loop so transient prompt-fetch failures
    #    (network/5xx → FetchError) also get the 3x retry treatment. The cache
    #    in get_prompt makes repeat fetches free after the first success.
    last_error = None
    for attempt_idx, wait_s in enumerate(RETRY_BACKOFF_S):
        attempt = attempt_idx + 1
        if wait_s > 0:
            log('info', 'retry_wait',
                brief_id=brief_id, attempt=attempt, wait_s=wait_s)
            time.sleep(wait_s)

        try:
            system_prompt = build_system_prompt(asset_type)
            context       = fetch_call_context(insight_id)
        except PromptNotFoundError as e:
            # Config issue — no amount of retry will help.
            log('error', 'prompt_not_found',
                brief_id=brief_id, asset_type=asset_type, detail=str(e)[:300])
            if not dry_run:
                write_terminal_failure(brief_id, f'prompt_not_found: {e}')
            return 'failed'
        except FetchError as e:
            last_error = f'fetch: {e}'
            log('warning', 'attempt_failed',
                brief_id=brief_id, attempt=attempt, stage='fetch',
                detail=str(e)[:300])
            if not dry_run:
                write_attempt_progress(brief_id, attempt, last_error)
            continue

        user_message = build_user_message(context)
        log('info', 'calling_claude',
            brief_id=brief_id, asset_type=asset_type, attempt=attempt,
            call_insight_id=insight_id,
            system_prompt_chars=len(system_prompt),
            user_message_chars=len(user_message))

        started = time.monotonic()
        try:
            api_response  = call_claude(system_prompt, user_message)
            brief_content = parse_brief(api_response)
        except (AuthError, RateLimitError) as e:
            # Operator-level failure — release the row to 'pending' so the
            # next invocation can retry once creds / rate limits are sorted.
            log('error', 'release_on_infra_failure',
                brief_id=brief_id, attempt=attempt, detail=str(e)[:300])
            if not dry_run:
                release_brief(brief_id, str(e))
            raise
        except GenerationError as e:
            last_error = f'generation: {e}'
            log('warning', 'attempt_failed',
                brief_id=brief_id, attempt=attempt, stage='generation',
                detail=str(e)[:300])
            if not dry_run:
                write_attempt_progress(brief_id, attempt, last_error)
            continue

        # Success.
        latency_ms = int((time.monotonic() - started) * 1000)
        metadata   = extract_metadata(api_response, system_prompt, user_message, latency_ms)
        prompt_used = f'SYSTEM:\n{system_prompt}\n\n---\n\nUSER:\n{user_message}'

        if dry_run:
            print(json.dumps({
                'brief_id':        brief_id,
                'asset_type':      asset_type,
                'call_insight_id': insight_id,
                'attempt':         attempt,
                'metadata':        metadata,
                'brief_preview':   brief_content[:1200],
                'brief_length':    len(brief_content),
            }, indent=2, ensure_ascii=False), flush=True)
            return 'processed'

        write_success(brief_id, brief_content, prompt_used, metadata)
        log('info', 'brief_ready',
            brief_id=brief_id, asset_type=asset_type, attempt=attempt,
            brief_chars=len(brief_content),
            latency_ms=latency_ms,
            output_tokens=metadata.get('output_tokens'))
        return 'processed'

    # All MAX_ATTEMPTS exhausted.
    log('error', 'all_attempts_failed',
        brief_id=brief_id, attempts=MAX_ATTEMPTS,
        detail=(last_error or 'unknown')[:300])
    if not dry_run:
        write_terminal_failure(brief_id, last_error or 'all_attempts_failed: unknown')
    return 'failed'


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

    # Pre-flight: verify the 'base' prompt is reachable in content_brief_prompts.
    # Asset-type prompts are loaded lazily per brief (each gets its own
    # terminal-vs-transient classification inside the retry loop).
    try:
        get_prompt('base')
    except PromptNotFoundError as e:
        log('error', 'base_prompt_missing_in_db', detail=str(e)[:300])
        return 1
    except FetchError as e:
        log('error', 'base_prompt_fetch_failed', detail=str(e)[:300])
        return 1

    start = time.monotonic()
    log('info', 'process_content_briefs_started',
        dry_run=args.dry_run,
        max_briefs=args.max_briefs,
        brief_id=args.brief_id,
        model=MODEL_ID,
        prompt_source='content_brief_prompts (DB)')

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
