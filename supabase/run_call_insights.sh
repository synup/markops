#!/bin/bash
# Wrapper for process_call_insights.py
# - Loads required env vars from /opt/google-ads-auditor/.env
# - Logs to /opt/google-ads-auditor/logs/process_call_insights_<YYYYMMDD>.log
# - Passes through any CLI args (--force-reprocess, --since YYYY-MM-DD,
#   --dry-run, --max-calls N)

cd /opt/google-ads-auditor || exit 1

# Extract env vars individually (avoids multi-line-source issues with JSON values)
export SUPABASE_URL=$(grep '^SUPABASE_URL=' .env | cut -d= -f2-)
export SUPABASE_SERVICE_ROLE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env | cut -d= -f2-)
export SALESHQ_API_TOKEN=$(grep '^SALESHQ_API_TOKEN=' .env | cut -d= -f2-)
export ANTHROPIC_API_KEY=$(grep '^ANTHROPIC_API_KEY=' .env | cut -d= -f2-)

LOGFILE="logs/process_call_insights_$(date -u +%Y%m%d).log"
{
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) start args=$* ==="
  python3 process_call_insights.py "$@"
  EXIT_CODE=$?
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) exit=$EXIT_CODE ==="
  exit $EXIT_CODE
} >> "$LOGFILE" 2>&1
