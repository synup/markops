#!/usr/bin/env python3
"""
Extract content intelligence insights from completed sales_calls.
Phase 2 of the Content Intelligence Workflow.

For each unprocessed completed call (oldest first):
  1. Fetch full meeting payload (incl. transcript) from Sales HQ /meetings/:id
  2. Call Claude Sonnet 4.6 with extract_call_insights_prompt.md as system prompt
  3. Parse 17-field JSON response + compute composite_score (sum of 5 dim scores)
  4. UPSERT into call_insights (UNIQUE on call_id; review-workflow columns preserved)
  5. PATCH sales_calls.processed_at; override conversation_type when LLM
     confidence >= 0.8 AND suggested differs from current.

Usage:
  python process_call_insights.py [--force-reprocess] [--since YYYY-MM-DD]
                                  [--dry-run] [--max-calls N]

Requires env vars:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SALESHQ_API_TOKEN
  SALESHQ_API_BASE          (optional; default https://saleshq.synup.com/api/external/v1)
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
CLAUDE_TIMEOUT_S  = 240
POLITE_DELAY_S    = 0.5
MAX_PER_RUN       = 500

ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
ANTHROPIC_VERSION = '2023-06-01'
MODEL_ID          = 'claude-sonnet-4-6'
MAX_TOKENS        = 8192

CONVERSATION_TYPE_OVERRIDE_THRESHOLD = 0.8

EXPECTED_KEYS = [
    'attribution_category', 'attribution_detail', 'attribution_asked',
    'attribution_confidence', 'problem_statement', 'problem_specificity_score',
    'suggested_asset_type', 'asset_rationale', 'icp_fit_score',
    'problem_clarity_score', 'reusability_score', 'novelty_score',
    'marketing_summary', 'customer_verbatim', 'suggested_conversation_type',
    'conversation_type_confidence', 'suggested_author',
]
SCORE_KEYS = [
    'icp_fit_score', 'problem_clarity_score', 'problem_specificity_score',
    'reusability_score', 'novelty_score',
]
VALID_CONV_TYPES = ('sales', 'cs', 'unknown')

SCRIPT_DIR  = os.path.dirname(os.path.abspath(__file__))
PROMPT_PATH = os.path.join(SCRIPT_DIR, 'extract_call_insights_prompt.md')

SUPABASE_URL              = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
SALESHQ_API_TOKEN         = os.environ.get('SALESHQ_API_TOKEN', '')
SALESHQ_API_BASE          = os.environ.get(
    'SALESHQ_API_BASE',
    'https://saleshq.synup.com/api/external/v1',
)
ANTHROPIC_API_KEY         = os.environ.get('ANTHROPIC_API_KEY', '')

CODE_FENCE_RE = re.compile(r'^```(?:json)?\s*\n(.*?)\n```\s*$', re.DOTALL)


# ─── exceptions (clean abort vs continue) ─────────────────────────────
class AuthError(Exception):
    """401 from Sales HQ or Anthropic — abort the run."""


class RateLimitError(Exception):
    """429 — abort the run."""


class TranscriptFetchError(Exception):
    """Per-call failure fetching transcript — skip this call, retry next run."""


class ExtractionError(Exception):
    """Per-call failure in Claude call / parse / DB write — skip this call."""


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
        description='Extract content intelligence insights from sales_calls.',
    )
    p.add_argument(
        '--force-reprocess', action='store_true',
        help='Re-extract calls whose processed_at is already set. UPSERT merges '
             'over existing call_insights row; review_status / reviewed_at / '
             'approved_asset_type / rejection_reason are preserved.',
    )
    p.add_argument(
        '--since', type=str, default=None, metavar='YYYY-MM-DD',
        help='Only process sales_calls with call_date >= this date (UTC).',
    )
    p.add_argument(
        '--dry-run', action='store_true',
        help='Fetch transcript and call Claude (costs apply), but skip both '
             'writes. Prints parsed JSON to stdout for each call.',
    )
    p.add_argument(
        '--max-calls', type=int, default=None, metavar='N',
        help='Process at most N calls this run. Useful with --dry-run for '
             'cheap debug loops.',
    )
    return p.parse_args()


# ─── prompt loader ────────────────────────────────────────────────────
def load_system_prompt():
    with open(PROMPT_PATH, 'r', encoding='utf-8') as f:
        return f.read()


# ─── Supabase reads ───────────────────────────────────────────────────
def fetch_unprocessed_calls(force, since, limit):
    """GET sales_calls — unprocessed completed rows, call_date.asc.

    Returns list of dicts with the columns needed downstream.
    """
    select = ','.join([
        'id', 'external_meeting_id', 'title', 'call_date',
        'rep_name', 'rep_email', 'customer_name', 'customer_company',
        'pipeline', 'conversation_type',
    ])
    params = [
        ('select', select),
        ('status', 'eq.completed'),
        ('order', 'call_date.asc'),
        ('limit', str(limit)),
    ]
    if not force:
        params.append(('processed_at', 'is.null'))
    if since:
        params.append(('call_date', f'gte.{since}'))

    url = f'{SUPABASE_URL}/rest/v1/sales_calls?{urlencode(params)}'
    headers = {
        'apikey':        SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
    }
    req = Request(url, headers=headers)
    with urlopen(req, timeout=HTTP_TIMEOUT_S) as resp:
        return json.loads(resp.read().decode())


# ─── Sales HQ transcript fetch ────────────────────────────────────────
def fetch_transcript(external_meeting_id):
    """GET /meetings/:id — return (content, word_count).

    Raises:
      AuthError              on 401  (abort run)
      RateLimitError         on 429  (abort run)
      TranscriptFetchError   on any other failure, or missing/empty content
                             (skip call, retry next run)
    """
    url = (
        f'{SALESHQ_API_BASE}/meetings/'
        f'{quote(str(external_meeting_id), safe="")}'
    )
    headers = {
        'Authorization': f'Bearer {SALESHQ_API_TOKEN}',
        'Accept':        'application/json',
    }
    req = Request(url, headers=headers)
    try:
        with urlopen(req, timeout=HTTP_TIMEOUT_S) as resp:
            body = json.loads(resp.read().decode())
    except HTTPError as e:
        if e.code == 401:
            raise AuthError('saleshq_401') from e
        if e.code == 429:
            raise RateLimitError('saleshq_429') from e
        detail = ''
        try:
            detail = e.read().decode() if e.fp else ''
        except Exception:
            pass
        raise TranscriptFetchError(
            f'http_status={e.code} detail={detail[:200]!r}'
        ) from e
    except URLError as e:
        raise TranscriptFetchError(f'url_error={e.reason!r}') from e

    transcript = body.get('transcript') or {}
    content    = transcript.get('content') or ''
    word_count = transcript.get('word_count')
    if not content.strip():
        raise TranscriptFetchError('empty_transcript_content')
    return content, word_count


# ─── Anthropic call ───────────────────────────────────────────────────
def build_user_message(sales_call, transcript_content):
    """Frame transcript with meeting metadata. System prompt instructs the
    LLM to infer conversation_type independently; showing the current value
    is a prior, not a directive (watch in spot-checks for over-agreement).
    """
    return (
        'Meeting metadata:\n'
        f'- Title: {sales_call.get("title") or "(none)"}\n'
        f'- Date: {sales_call.get("call_date")}\n'
        f'- Rep: {sales_call.get("rep_name") or "(none)"} '
        f'({sales_call.get("rep_email") or "(none)"})\n'
        f'- Customer: {sales_call.get("customer_name") or "(none)"} at '
        f'{sales_call.get("customer_company") or "(none)"}\n'
        f'- Current pipeline classification: '
        f'{sales_call.get("pipeline") or "(none)"} '
        f'({sales_call.get("conversation_type")})\n\n'
        'Transcript:\n'
        f'{transcript_content}\n'
    )


def call_claude(system_prompt, user_message):
    """POST /v1/messages. One 5s-delay retry on URLError/5xx.

    Raises:
      AuthError         on 401            (abort run)
      RateLimitError    on 429            (abort run)
      ExtractionError   on other failures (skip call)
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
            detail = ''
            try:
                detail = e.read().decode() if e.fp else ''
            except Exception:
                pass
            if e.code == 401:
                raise AuthError(f'anthropic_401 detail={detail[:200]!r}') from e
            if e.code == 429:
                raise RateLimitError(f'anthropic_429 detail={detail[:200]!r}') from e
            if 500 <= e.code < 600 and attempt == 1:
                last_err = f'http_status={e.code} detail={detail[:200]!r}'
                time.sleep(5)
                continue
            raise ExtractionError(
                f'anthropic_http_status={e.code} detail={detail[:200]!r}'
            ) from e
        except URLError as e:
            if attempt == 1:
                last_err = f'url_error={e.reason!r}'
                time.sleep(5)
                continue
            raise ExtractionError(f'anthropic_url_error={e.reason!r}') from e

    raise ExtractionError(f'anthropic_unreachable last_err={last_err!r}')


# ─── parse Claude response ────────────────────────────────────────────
def parse_extraction(api_response):
    """Pull text from messages API response, strip code fences, json.loads,
    validate all 17 expected keys present.
    """
    content_blocks = api_response.get('content') or []
    text_parts = [b.get('text', '') for b in content_blocks if b.get('type') == 'text']
    text = ''.join(text_parts).strip()
    if not text:
        raise ExtractionError('empty_response_text')

    m = CODE_FENCE_RE.match(text)
    if m:
        text = m.group(1).strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise ExtractionError(f'json_decode_failed detail={str(e)[:200]!r}') from e
    if not isinstance(data, dict):
        raise ExtractionError(f'json_not_object type={type(data).__name__}')

    missing = [k for k in EXPECTED_KEYS if k not in data]
    if missing:
        raise ExtractionError(f'missing_keys={",".join(missing)}')
    return data


def compute_composite_score(extraction):
    """Sum the 5 dimension scores (5–25). LLM also returns these as ints;
    fail extraction if any are non-int (CHECK constraints expect ints)."""
    total = 0
    for k in SCORE_KEYS:
        v = extraction.get(k)
        if not isinstance(v, int) or isinstance(v, bool):
            raise ExtractionError(f'non_int_score key={k} value={v!r}')
        total += v
    return total


# ─── Supabase writes ──────────────────────────────────────────────────
def upsert_call_insights(call_id, extraction, composite_score):
    """POST call_insights with merge-duplicates on call_id. Payload omits the
    review-workflow columns so existing values survive a --force-reprocess.
    """
    payload = {
        'call_id':         call_id,
        'composite_score': composite_score,
        'model_version':   MODEL_ID,
        'extracted_at':    datetime.now(timezone.utc).isoformat(),
    }
    for k in EXPECTED_KEYS:
        payload[k] = extraction.get(k)

    url = f'{SUPABASE_URL}/rest/v1/call_insights?on_conflict=call_id'
    headers = {
        'apikey':        SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
        'Content-Type':  'application/json',
        'Prefer':        'resolution=merge-duplicates,return=minimal',
    }
    body = json.dumps(payload).encode()
    req  = Request(url, data=body, headers=headers, method='POST')
    try:
        with urlopen(req, timeout=HTTP_TIMEOUT_S) as resp:
            resp.read()
    except HTTPError as e:
        detail = ''
        try:
            detail = e.read().decode() if e.fp else ''
        except Exception:
            pass
        raise ExtractionError(
            f'upsert_failed http_status={e.code} detail={detail[:500]!r}'
        ) from e
    except URLError as e:
        raise ExtractionError(f'upsert_url_error={e.reason!r}') from e


def update_sales_call(call_id, conversation_type_override):
    """PATCH sales_calls: set processed_at and (optionally) conversation_type."""
    payload = {'processed_at': datetime.now(timezone.utc).isoformat()}
    if conversation_type_override is not None:
        payload['conversation_type'] = conversation_type_override

    url = (
        f'{SUPABASE_URL}/rest/v1/sales_calls'
        f'?id=eq.{quote(call_id, safe="")}'
    )
    headers = {
        'apikey':        SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
        'Content-Type':  'application/json',
        'Prefer':        'return=minimal',
    }
    body = json.dumps(payload).encode()
    req  = Request(url, data=body, headers=headers, method='PATCH')
    try:
        with urlopen(req, timeout=HTTP_TIMEOUT_S) as resp:
            resp.read()
    except HTTPError as e:
        detail = ''
        try:
            detail = e.read().decode() if e.fp else ''
        except Exception:
            pass
        raise ExtractionError(
            f'sales_calls_patch_failed http_status={e.code} detail={detail[:500]!r}'
        ) from e
    except URLError as e:
        raise ExtractionError(f'sales_calls_patch_url_error={e.reason!r}') from e


# ─── orchestration ────────────────────────────────────────────────────
def decide_override(extraction, current_conv_type):
    """Return the new conversation_type to PATCH, or None to leave alone."""
    suggested  = extraction.get('suggested_conversation_type')
    confidence = extraction.get('conversation_type_confidence')
    if not isinstance(confidence, (int, float)) or isinstance(confidence, bool):
        return None
    if confidence < CONVERSATION_TYPE_OVERRIDE_THRESHOLD:
        return None
    if suggested not in VALID_CONV_TYPES:
        return None
    if suggested == current_conv_type:
        return None
    return suggested


def process_one_call(sales_call, system_prompt, dry_run):
    """Return ('processed' | 'transcript_missing' | 'failed', overrode: bool).

    AuthError / RateLimitError propagate to caller (abort run).
    """
    call_id           = sales_call['id']
    external_id       = sales_call['external_meeting_id']
    current_conv_type = sales_call.get('conversation_type')

    try:
        content, word_count = fetch_transcript(external_id)
    except TranscriptFetchError as e:
        log('warning', 'transcript_missing',
            call_id=call_id, external_meeting_id=str(external_id),
            detail=str(e)[:200])
        return 'transcript_missing', False

    log('info', 'calling_claude',
        call_id=call_id, external_meeting_id=str(external_id),
        transcript_word_count=word_count)

    try:
        api_response = call_claude(system_prompt,
                                   build_user_message(sales_call, content))
        extraction   = parse_extraction(api_response)
        composite    = compute_composite_score(extraction)
    except ExtractionError as e:
        log('error', 'extraction_failed',
            call_id=call_id, external_meeting_id=str(external_id),
            detail=str(e)[:300])
        return 'failed', False

    override = decide_override(extraction, current_conv_type)

    if dry_run:
        print(json.dumps({
            'call_id':                    call_id,
            'external_meeting_id':        external_id,
            'transcript_word_count':      word_count,
            'composite_score':            composite,
            'conversation_type_override': override,
            'current_conversation_type':  current_conv_type,
            'extraction':                 extraction,
        }, indent=2, ensure_ascii=False), flush=True)
        return 'processed', override is not None

    try:
        upsert_call_insights(call_id, extraction, composite)
        update_sales_call(call_id, override)
    except ExtractionError as e:
        log('error', 'write_failed',
            call_id=call_id, external_meeting_id=str(external_id),
            detail=str(e)[:300])
        return 'failed', False

    if override is not None:
        log('info', 'conversation_type_overridden',
            call_id=call_id, external_meeting_id=str(external_id),
            old=current_conv_type, new=override,
            confidence=extraction.get('conversation_type_confidence'))

    return 'processed', override is not None


# ─── entry point ──────────────────────────────────────────────────────
def main():
    args = parse_args()

    if args.since:
        try:
            datetime.strptime(args.since, '%Y-%m-%d')
        except ValueError:
            log('error', 'invalid_since_date', value=args.since)
            return 1

    missing = [
        name for name, val in [
            ('SUPABASE_URL',              SUPABASE_URL),
            ('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY),
            ('SALESHQ_API_TOKEN',         SALESHQ_API_TOKEN),
            ('ANTHROPIC_API_KEY',         ANTHROPIC_API_KEY),
        ] if not val
    ]
    if missing:
        log('error', 'missing_env_vars', vars=','.join(missing))
        return 1

    try:
        system_prompt = load_system_prompt()
    except OSError as e:
        log('error', 'prompt_load_failed', path=PROMPT_PATH, detail=repr(e))
        return 1

    start = time.monotonic()
    log('info', 'process_call_insights_started',
        force_reprocess=args.force_reprocess,
        since=args.since,
        dry_run=args.dry_run,
        max_calls=args.max_calls,
        model=MODEL_ID)

    fetch_limit = min(args.max_calls, MAX_PER_RUN) if args.max_calls else MAX_PER_RUN

    try:
        calls = fetch_unprocessed_calls(args.force_reprocess, args.since, fetch_limit)
    except (HTTPError, URLError) as e:
        log('error', 'fetch_unprocessed_failed', detail=repr(e))
        return 1

    log('info', 'fetched_candidates', count=len(calls))

    counters = {'processed': 0, 'failed': 0, 'transcript_missing': 0,
                'conversation_type_overridden': 0}
    exit_code = 0

    try:
        for i, sc in enumerate(calls):
            result, overrode = process_one_call(sc, system_prompt, args.dry_run)
            counters[result] = counters.get(result, 0) + 1
            if overrode:
                counters['conversation_type_overridden'] += 1
            if i < len(calls) - 1:
                time.sleep(POLITE_DELAY_S)
    except AuthError as e:
        log('error', 'auth_failed', detail=str(e)[:500])
        exit_code = 1
    except RateLimitError as e:
        log('error', 'rate_limited', detail=str(e)[:500])
        exit_code = 1

    duration_s = round(time.monotonic() - start, 1)
    log('info', 'process_call_insights_completed',
        candidates=len(calls),
        processed=counters['processed'],
        failed=counters['failed'],
        transcript_missing=counters['transcript_missing'],
        conversation_type_overridden=counters['conversation_type_overridden'],
        duration_s=duration_s,
        dry_run=args.dry_run)

    return exit_code


if __name__ == '__main__':
    sys.exit(main())
