#!/bin/bash
# Wrapper for process_content_drafts.py
# - Loads required env vars from /opt/google-ads-auditor/.env
# - Logs to /opt/google-ads-auditor/logs/process_content_drafts_<YYYYMMDD>.log
# - Passes through any CLI args (--dry-run, --max-drafts N, --draft-id UUID)
#
# Suggested cron entry:
#   */2 * * * * /opt/google-ads-auditor/run_content_drafts.sh

cd /opt/google-ads-auditor || exit 1

# Extract env vars individually (avoids multi-line-source issues with JSON values)
export SUPABASE_URL=$(grep '^SUPABASE_URL=' .env | cut -d= -f2-)
export SUPABASE_SERVICE_ROLE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env | cut -d= -f2-)
export ANTHROPIC_API_KEY=$(grep '^ANTHROPIC_API_KEY=' .env | cut -d= -f2-)

mkdir -p logs
LOGFILE="logs/process_content_drafts_$(date -u +%Y%m%d).log"
{
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) start args=$* ==="
  python3 process_content_drafts.py "$@"
  EXIT_CODE=$?
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) exit=$EXIT_CODE ==="
  exit $EXIT_CODE
} >> "$LOGFILE" 2>&1
