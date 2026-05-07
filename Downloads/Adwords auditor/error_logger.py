import json
import os
import traceback
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')


class ErrorLogger:
    def __init__(self, job_name):
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
        self.log_error(message, details, severity='warning')

    def log_critical(self, message, details=None):
        self.log_error(message, details, severity='critical')

    def log_exception(self, message, exc):
        tb = traceback.format_exception(type(exc), exc, exc.__traceback__)
        self.log_error(message, {
            'exception': str(exc),
            'traceback': ''.join(tb)[-2000:],
        })

    def heartbeat(self, status='ok', last_error=None):
        try:
            payload = {
                'job_name': self.job_name,
                'last_seen_at': datetime.now(timezone.utc).isoformat(),
                'status': status,
            }
            if last_error:
                payload['last_error'] = last_error[:500]

            url = "{}/rest/v1/job_heartbeats?on_conflict=job_name".format(SUPABASE_URL)
            headers = {
                'apikey': SUPABASE_KEY,
                'Authorization': 'Bearer {}'.format(SUPABASE_KEY),
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates,return=minimal',
            }
            data = json.dumps(payload).encode()
            req = Request(url, data=data, headers=headers, method='POST')
            with urlopen(req) as resp:
                pass
        except Exception as e:
            print("[ErrorLogger] Failed to send heartbeat: {}".format(e))
