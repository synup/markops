#!/bin/bash
# AI Visibility Tracker — scheduler wrapper
# Checks if enough time has elapsed based on schedule_frequency, then runs.
#
# Crontab (run daily at 6 AM, script decides whether to actually execute):
#   0 6 * * * /opt/google-ads-auditor/run_ai_visibility.sh

set -e

PROJECT_DIR="/opt/google-ads-auditor"
VENV="$PROJECT_DIR/venv/bin/python"
SCRIPT="$PROJECT_DIR/fetch_ai_visibility.py"
LOG="/var/log/ai_visibility.log"

# Load environment variables
source "$PROJECT_DIR/.env"
export SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY OPENAI_API_KEY ANTHROPIC_API_KEY

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"
}

log "Scheduler check starting..."

# Query last completed run from Supabase
LAST_RUN_JSON=$($VENV -c "
import json, os
from urllib.request import Request, urlopen

url = os.environ['SUPABASE_URL'] + '/rest/v1/ai_visibility_runs?status=eq.completed&order=completed_at.desc&limit=1&select=completed_at,schedule_frequency'
headers = {
    'apikey': os.environ['SUPABASE_SERVICE_ROLE_KEY'],
    'Authorization': 'Bearer ' + os.environ['SUPABASE_SERVICE_ROLE_KEY'],
}
req = Request(url, headers=headers)
with urlopen(req) as resp:
    print(resp.read().decode())
" 2>/dev/null || echo "[]")

# Determine if we should run based on frequency
SHOULD_RUN=$($VENV -c "
import json, sys
from datetime import datetime, timezone, timedelta

runs = json.loads('$LAST_RUN_JSON')
if not runs:
    print('yes')
    sys.exit(0)

last = runs[0]
completed = datetime.fromisoformat(last['completed_at'].replace('Z', '+00:00'))
freq = last.get('schedule_frequency') or '2x-week'

intervals = {
    'daily': timedelta(hours=20),
    '2x-week': timedelta(days=3),
    'weekly': timedelta(days=6),
    'manual': timedelta(days=36500),
}
threshold = intervals.get(freq, timedelta(days=3))
elapsed = datetime.now(timezone.utc) - completed

if elapsed >= threshold:
    print('yes')
else:
    print('no')
" 2>/dev/null || echo "yes")

if [ "$SHOULD_RUN" = "no" ]; then
    log "Skipping — not enough time elapsed since last run."
    exit 0
fi

log "Starting AI visibility run..."

cd "$PROJECT_DIR"
$VENV "$SCRIPT" >> "$LOG" 2>&1
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    log "AI visibility run completed successfully."
else
    log "ERROR: AI visibility run failed with exit code $EXIT_CODE"
fi

exit $EXIT_CODE
