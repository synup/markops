"""
Shared error logging and heartbeat utility for all backend cron jobs.

Usage:
    from error_logger import ErrorLogger

    logger = ErrorLogger('audit_poller')
    logger.heartbeat()                       # Record that the job ran
    logger.log_error('Something broke', {'traceback': '...'})
    logger.log_warning('Retrying...', {'attempt': 2})
    logger.heartbeat(status='error', last_error='Crash')  # Record error state
"""

import json
import os
import traceback
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')


class ErrorLogger:
    def __init__(self, job_name: str):
        self.job_name = job_name

    def _api(self, method, table, params='', payload=None):
        url = "{}/rest/v1/{}{}".format(SUPABASE_URL, table, params)
        headers = {
            'apikey': SUPABASE_KEY,
            'Authorization': 'Bearer {}'.format(SUPABASE_KEY),
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
        }
        data = json.dumps(payload).encode() if payload else None
        req = Request(url, data=data, headers=headers, method=method)
        try:
            with urlopen(req) as resp:
                return json.loads(resp.read().decode())
        except HTTPError as e:
            body = e.read().decode() if e.fp else ''
            print("[ErrorLogger] API error {}: {}".format(e.code, body))
            return None

    def log_error(self, message, details=None, severity='error'):
        """Log an error to the error_logs table."""
        try:
            self._api('POST', 'error_logs', '', {
                'job_name': self.job_name,
                'severity': severity,
                'message': message[:1000],
                'details': details or {},
            })
        except Exception as e:
            print("[ErrorLogger] Failed to log error: {}".format(e))

    def log_warning(self, message, details=None):
        """Log a warning."""
        self.log_error(message, details, severity='warning')

    def log_critical(self, message, details=None):
        """Log a critical error."""
        self.log_error(message, details, severity='critical')

    def log_exception(self, message, exc):
        """Log an exception with its traceback."""
        tb = traceback.format_exception(type(exc), exc, exc.__traceback__)
        self.log_error(message, {
            'exception': str(exc),
            'traceback': ''.join(tb)[-2000:],
        })

    def heartbeat(self, status='ok', last_error=None):
        """Upsert a heartbeat record for this job."""
        try:
            now_iso = datetime.now(timezone.utc).isoformat()
            payload = {
                'job_name': self.job_name,
                'last_seen_at': now_iso,
                'status': status,
                'run_count': 1,
            }
            if last_error:
                payload['last_error'] = last_error[:500]

            # Try upsert: update if exists, insert if not
            # Supabase upsert via POST with Prefer: resolution=merge-duplicates
            url = "{}/rest/v1/job_heartbeats".format(SUPABASE_URL)
            headers = {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer {}'.format(SUPABASE_KEY),
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=representation',
            }
            data = json.dumps(payload).encode()
            req = Request(url, data=data, headers=headers, method='POST')
            with urlopen(req) as resp:
                pass

            # Increment run_count via separate RPC or just leave it at 1
            # For simplicity, we'll do a GET + PATCH to increment
            existing = self._api(
                'GET', 'job_heartbeats',
                '?job_name=eq.{}&select=run_count'.format(self.job_name)
            )
            if existing and len(existing) > 0:
                current_count = existing[0].get('run_count', 0)
                self._api(
                    'PATCH', 'job_heartbeats',
                    '?job_name=eq.{}'.format(self.job_name),
                    {'run_count': current_count + 1}
                )
        except Exception as e:
            print("[ErrorLogger] Failed to send heartbeat: {}".format(e))
