#!/usr/bin/env python3
"""
Polls Supabase for pending audit requests AND checks scheduled audits.
Runs on the DigitalOcean droplet via cron every 5 minutes.
"""

import json
import os
import subprocess
import glob
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
PROJECT_DIR = '/opt/google-ads-auditor'
VENV_PYTHON = '{}/venv/bin/python'.format(PROJECT_DIR)


def api_request(method, table, params='', payload=None):
    """Make a Supabase REST API request."""
    url = "{}/rest/v1/{}{}".format(SUPABASE_URL, table, params)
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer {}'.format(SUPABASE_KEY),
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    }
    data = json.dumps(payload).encode() if payload else None
    req = Request(url, data=data, headers=headers, method=method)
    with urlopen(req) as resp:
        return json.loads(resp.read().decode())


def now():
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def check_pending():
    """Check for pending on-demand audit requests."""
    try:
        rows = api_request(
            'GET', 'audit_requests',
            '?status=eq.pending&order=requested_at.asc&limit=1'
        )
        return rows[0] if rows else None
    except Exception as e:
        print("[{}] Error checking requests: {}".format(now(), e))
        return None


def check_schedules():
    """Check if any scheduled audit is due to run."""
    try:
        rows = api_request(
            'GET', 'audit_schedules',
            '?enabled=eq.true'
        )
        if not rows:
            return False

        utc_now = datetime.now(timezone.utc)

        for schedule in rows:
            if is_schedule_due(schedule, utc_now):
                print("[{}] Schedule {} is due, triggering audit".format(now(), schedule['id']))
                create_request_from_schedule(schedule, utc_now)
                return True
        return False
    except Exception as e:
        print("[{}] Error checking schedules: {}".format(now(), e))
        return False


def is_schedule_due(schedule, utc_now):
    """Determine if a schedule should trigger now."""
    try:
        from zoneinfo import ZoneInfo
    except ImportError:
        from backports.zoneinfo import ZoneInfo

    tz = ZoneInfo(schedule['timezone'])
    local_now = utc_now.astimezone(tz)

    sched_hour = schedule['hour']
    sched_minute = schedule['minute']
    frequency = schedule['frequency']

    # Only trigger within a 5-minute window of the scheduled time
    if local_now.hour != sched_hour:
        return False
    if abs(local_now.minute - sched_minute) > 4:
        return False

    # Check if already triggered recently (within 6 hours)
    last = schedule.get('last_triggered_at')
    if last:
        last_dt = datetime.fromisoformat(last.replace('Z', '+00:00'))
        hours_since = (utc_now - last_dt).total_seconds() / 3600
        if hours_since < 6:
            return False

    # Check frequency-specific conditions
    if frequency == 'daily':
        return True
    elif frequency == 'weekly':
        return local_now.weekday() == convert_day(schedule.get('day_of_week', 0))
    elif frequency == 'biweekly':
        if local_now.weekday() != convert_day(schedule.get('day_of_week', 0)):
            return False
        week_num = local_now.isocalendar()[1]
        return week_num % 2 == 0
    elif frequency == 'monthly':
        return local_now.day == schedule.get('day_of_month', 1)

    return False


def convert_day(js_day):
    """Convert JS day (0=Sun) to Python weekday (0=Mon)."""
    return (js_day - 1) % 7


def create_request_from_schedule(schedule, utc_now):
    """Create an audit request and update last_triggered_at."""
    try:
        api_request('POST', 'audit_requests', '', {
            'status': 'pending',
            'requested_by': schedule.get('created_by'),
        })
        api_request(
            'PATCH', 'audit_schedules',
            '?id=eq.{}'.format(schedule['id']),
            {'last_triggered_at': utc_now.isoformat()}
        )
    except Exception as e:
        print("[{}] Error creating scheduled request: {}".format(now(), e))


def update_request(request_id, updates):
    """Update an audit request status."""
    try:
        api_request('PATCH', 'audit_requests', '?id=eq.{}'.format(request_id), updates)
    except Exception as e:
        print("[{}] Error updating request {}: {}".format(now(), request_id, e))


def run_audit(request_id):
    """Run the audit and push results to Supabase."""
    print("[{}] Starting audit for request {}".format(now(), request_id))
    update_request(request_id, {
        'status': 'running',
        'started_at': datetime.utcnow().isoformat(),
    })

    try:
        result = subprocess.run(
            [VENV_PYTHON, '-m', 'google_ads_auditor.run_audit', '--json-only'],
            cwd=PROJECT_DIR,
            capture_output=True, text=True, timeout=300,
        )

        if result.returncode != 0:
            error = result.stderr[:500] if result.stderr else 'Unknown error'
            print("[{}] Audit failed: {}".format(now(), error))
            update_request(request_id, {
                'status': 'failed',
                'completed_at': datetime.utcnow().isoformat(),
                'error_message': error,
            })
            return

        reports = sorted(glob.glob('{}/reports/google_ads_audit_*.json'.format(PROJECT_DIR)))
        if not reports:
            update_request(request_id, {
                'status': 'failed',
                'completed_at': datetime.utcnow().isoformat(),
                'error_message': 'No report file generated',
            })
            return

        latest = reports[-1]
        print("[{}] Report generated: {}".format(now(), latest))

        push_result = subprocess.run(
            [VENV_PYTHON, '{}/push_to_supabase.py'.format(PROJECT_DIR), latest],
            cwd=PROJECT_DIR,
            capture_output=True, text=True, timeout=60,
        )

        if push_result.returncode != 0:
            error = push_result.stderr[:500] if push_result.stderr else 'Push failed'
            update_request(request_id, {
                'status': 'failed',
                'completed_at': datetime.utcnow().isoformat(),
                'error_message': error,
            })
            return

        update_request(request_id, {
            'status': 'completed',
            'completed_at': datetime.utcnow().isoformat(),
        })
        print("[{}] Audit completed successfully".format(now()))

    except subprocess.TimeoutExpired:
        update_request(request_id, {
            'status': 'failed',
            'completed_at': datetime.utcnow().isoformat(),
            'error_message': 'Audit timed out after 5 minutes',
        })
    except Exception as e:
        update_request(request_id, {
            'status': 'failed',
            'completed_at': datetime.utcnow().isoformat(),
            'error_message': str(e)[:500],
        })


if __name__ == '__main__':
    # First check on-demand requests
    pending = check_pending()
    if pending:
        run_audit(pending['id'])
    else:
        # Then check scheduled audits
        check_schedules()
        # Re-check in case a schedule just created a request
        pending = check_pending()
        if pending:
            run_audit(pending['id'])
