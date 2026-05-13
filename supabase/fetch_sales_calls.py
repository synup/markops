#!/usr/bin/env python3
"""
Fetch Sales HQ meetings into the sales_calls table.
Phase 1, Step 2 of the Content Intelligence Workflow.

Runs incrementally: pulls meetings whose call_date is newer than the
latest row already in sales_calls. On an empty DB (or when --backfill-days
is set), defaults to a 90-day window.

Ingests all four statuses (completed / processing / failed / pending);
Phase 2 extraction filters to completed only.

Usage:
  python fetch_sales_calls.py [--backfill-days N] [--dry-run]

Requires env vars:
  SALESHQ_API_TOKEN
  SALESHQ_API_BASE          (optional; default https://saleshq.synup.com/api/external/v1)
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


# ─── constants ────────────────────────────────────────────────────────
PAGE_LIMIT       = 200
POLITE_DELAY_S   = 0.1
DEFAULT_BACKFILL = 90
HTTP_TIMEOUT_S   = 30
SAFETY_LOOKBACK  = timedelta(minutes=1)

SALES_PIPELINES  = {'Sales Pipeline', 'Exec Pipeline'}
CS_PIPELINES     = {'Customer Onboarding', 'Customer Success'}

SUPABASE_URL              = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
SALESHQ_API_TOKEN         = os.environ.get('SALESHQ_API_TOKEN', '')
SALESHQ_API_BASE          = os.environ.get(
    'SALESHQ_API_BASE',
    'https://saleshq.synup.com/api/external/v1',
)


# ─── exceptions (clean abort vs continue) ─────────────────────────────
class AuthError(Exception):
    """401 from Sales HQ — abort the run."""


class RateLimitError(Exception):
    """429 from Sales HQ — abort the run."""


class PageFetchError(Exception):
    """Non-recoverable failure fetching a meetings page — abort the run."""


# ─── logging ──────────────────────────────────────────────────────────
def log(level: str, event: str, **fields) -> None:
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


# ─── pure helpers ─────────────────────────────────────────────────────
def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description='Fetch Sales HQ meetings into sales_calls.',
    )
    p.add_argument(
        '--backfill-days', type=int, default=None, metavar='N',
        help='Pull meetings from the last N days. Default: incremental from '
             'max(call_date), or 90 if table empty.',
    )
    p.add_argument(
        '--dry-run', action='store_true',
        help='Fetch and log only; do not write to Supabase.',
    )
    return p.parse_args()


def derive_conversation_type(pipeline):
    """Sales HQ pipeline -> 'sales' | 'cs' | None (None = skip)."""
    if pipeline in SALES_PIPELINES:
        return 'sales'
    if pipeline in CS_PIPELINES:
        return 'cs'
    return None


def _titlecase_local_part(local: str) -> str:
    """'mary-jane.smith' -> 'Mary Jane Smith' (split on . _ -)."""
    for sep in '-_':
        local = local.replace(sep, '.')
    return ' '.join(p.capitalize() for p in local.split('.') if p)


def derive_rep_name(email):
    """'madeleine.johnson@synup.com' -> 'Madeleine Johnson'."""
    if not email or '@' not in email:
        return None
    return _titlecase_local_part(email.split('@', 1)[0]) or None


def derive_company_from_email(email):
    """'allula@ciwebgroup.com' -> 'Ciwebgroup'. Hyphens become spaces."""
    if not email or '@' not in email:
        return None
    domain = email.split('@', 1)[1]
    base   = domain.rsplit('.', 1)[0]
    return ' '.join(w.capitalize() for w in base.split('-') if w) or None


def derive_customer_fields(external_attendees):
    """First external attendee → name/email/company dict.

    Sales HQ shape: [{"email": "...", "name": str | null}, ...]
    """
    if not external_attendees:
        return {'name': None, 'email': None, 'company': None}
    a     = external_attendees[0] or {}
    email = a.get('email')
    name  = a.get('name') or derive_rep_name(email)
    return {
        'name':    name,
        'email':   email,
        'company': derive_company_from_email(email),
    }


# ─── I/O helpers ──────────────────────────────────────────────────────
def get_since_timestamp(backfill_days):
    """Return ISO8601 UTC timestamp for the API `from=` param.

    - If --backfill-days given, return now - N days.
    - Otherwise query max(call_date) from sales_calls. If a row exists,
      return that minus a 1-minute safety lookback. If empty, fall back
      to DEFAULT_BACKFILL days.
    """
    if backfill_days is not None:
        since = datetime.now(timezone.utc) - timedelta(days=backfill_days)
        return since.isoformat()

    url = (
        f'{SUPABASE_URL}/rest/v1/sales_calls'
        '?select=call_date&order=call_date.desc&limit=1'
    )
    headers = {
        'apikey':        SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_ROLE_KEY}',
    }
    req = Request(url, headers=headers)
    with urlopen(req, timeout=HTTP_TIMEOUT_S) as resp:
        rows = json.loads(resp.read().decode())

    if not rows:
        since = datetime.now(timezone.utc) - timedelta(days=DEFAULT_BACKFILL)
    else:
        latest_str = rows[0]['call_date'].replace('Z', '+00:00')
        since      = datetime.fromisoformat(latest_str) - SAFETY_LOOKBACK
    return since.isoformat()


def fetch_meetings_page(since: str, page: int) -> list:
    """GET /meetings — one page. Raises on auth/rate-limit/fetch failure."""
    params = urlencode({'from': since, 'limit': PAGE_LIMIT, 'page': page})
    url    = f'{SALESHQ_API_BASE}/meetings?{params}'
    headers = {
        'Authorization': f'Bearer {SALESHQ_API_TOKEN}',
        'Accept':        'application/json',
    }
    req = Request(url, headers=headers)
    try:
        with urlopen(req, timeout=HTTP_TIMEOUT_S) as resp:
            body = json.loads(resp.read().decode())
    except HTTPError as e:
        detail = ''
        try:
            detail = e.read().decode() if e.fp else ''
        except Exception:
            pass
        if e.code == 401:
            raise AuthError(detail) from e
        if e.code == 429:
            raise RateLimitError(detail) from e
        raise PageFetchError(f'http_status={e.code} detail={detail!r}') from e
    except URLError as e:
        raise PageFetchError(f'url_error={e.reason!r}') from e

    if isinstance(body, list):
        return body
    return body.get('data') or body.get('meetings') or []


def upsert_sales_call(meeting: dict, dry_run: bool) -> str:
    """Derive fields + UPSERT one meeting.

    Returns: 'ingested' | 'skipped' | 'errored'.

    Columns intentionally omitted from the payload (pipeline-owned, must
    survive UPSERTs): ingested_at (default now() on first insert),
    processed_at (owned by Phase 2 extraction), raw_detail_payload
    (populated on-demand by the transcript-open path).
    """
    meeting_id = meeting.get('id')
    if meeting_id is None:
        log('error', 'missing_meeting_id', meeting_keys=str(list(meeting.keys()))[:200])
        return 'errored'

    structured       = (meeting.get('summary') or {}).get('structured_data') or {}
    pipeline         = structured.get('pipeline')
    conversation_type = derive_conversation_type(pipeline)

    if conversation_type is None:
        log('warning', 'skip_unmapped_pipeline',
            meeting_id=str(meeting_id), pipeline=pipeline)
        return 'skipped'

    customer = derive_customer_fields(meeting.get('external_attendees') or [])

    payload = {
        'external_meeting_id':   str(meeting_id),
        'title':                 meeting.get('title'),
        'meet_link':             meeting.get('meet_link'),
        'rep_email':             meeting.get('organizer_email'),
        'rep_name':              derive_rep_name(meeting.get('organizer_email')),
        'customer_name':         customer['name'],
        'customer_company':      customer['company'],
        'customer_email':        customer['email'],
        'call_date':             meeting.get('start_time'),
        'call_duration_seconds': meeting.get('duration_seconds'),
        'pipeline':              pipeline,
        'conversation_type':     conversation_type,
        'status':                meeting.get('status'),
        'crm_fields':            structured.get('crm_fields'),
        'raw_list_payload':      meeting,
    }

    if dry_run:
        log('info', 'dry_run_upsert',
            meeting_id=str(meeting_id),
            conversation_type=conversation_type,
            status=payload['status'])
        return 'ingested'

    url = (
        f'{SUPABASE_URL}/rest/v1/sales_calls'
        '?on_conflict=external_meeting_id'
    )
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
        return 'ingested'
    except HTTPError as e:
        detail = ''
        try:
            detail = e.read().decode() if e.fp else ''
        except Exception:
            pass
        log('error', 'upsert_failed',
            meeting_id=str(meeting_id), http_status=e.code, detail=detail[:500])
        return 'errored'
    except URLError as e:
        log('error', 'upsert_failed',
            meeting_id=str(meeting_id), url_error=repr(e.reason))
        return 'errored'


# ─── entry point ──────────────────────────────────────────────────────
def main() -> int:
    args = parse_args()

    missing = [
        name for name, val in [
            ('SUPABASE_URL',              SUPABASE_URL),
            ('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY),
            ('SALESHQ_API_TOKEN',         SALESHQ_API_TOKEN),
        ] if not val
    ]
    if missing:
        log('error', 'missing_env_vars', vars=','.join(missing))
        return 1

    start = time.monotonic()

    try:
        since = get_since_timestamp(args.backfill_days)
    except (HTTPError, URLError) as e:
        log('error', 'since_query_failed', detail=repr(e))
        return 1

    log('info', 'fetch_sales_calls_started',
        since=since, backfill_days=args.backfill_days, dry_run=args.dry_run)

    counters = {'fetched': 0, 'ingested': 0, 'skipped': 0, 'errored': 0}
    pages    = 0
    exit_code = 0

    page = 1
    try:
        while True:
            meetings = fetch_meetings_page(since, page)
            pages   += 1
            counters['fetched'] += len(meetings)

            for m in meetings:
                try:
                    result = upsert_sales_call(m, args.dry_run)
                except Exception as e:
                    log('error', 'meeting_processing_exception',
                        meeting_id=str((m or {}).get('id')), detail=repr(e))
                    counters['errored'] += 1
                    continue
                counters[result] = counters.get(result, 0) + 1

            if len(meetings) < PAGE_LIMIT:
                break
            page += 1
            time.sleep(POLITE_DELAY_S)
    except AuthError as e:
        log('error', 'auth_failed', detail=str(e)[:500])
        exit_code = 1
    except RateLimitError as e:
        log('error', 'rate_limited', detail=str(e)[:500])
        exit_code = 1
    except PageFetchError as e:
        log('error', 'page_fetch_failed', page=page, detail=str(e)[:500])
        exit_code = 1

    duration_s = round(time.monotonic() - start, 1)
    log('info', 'fetch_sales_calls_completed',
        since=since,
        fetched=counters['fetched'],
        ingested=counters['ingested'],
        skipped=counters['skipped'],
        errored=counters['errored'],
        pages=pages,
        duration_s=duration_s,
        dry_run=args.dry_run)

    return exit_code


if __name__ == '__main__':
    sys.exit(main())
