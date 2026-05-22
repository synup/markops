#!/bin/bash
# Wrapper for process_content_briefs.py
# - Loads required env vars from /opt/google-ads-auditor/.env
# - Logs to /opt/google-ads-auditor/logs/process_content_briefs_<YYYYMMDD>.log
# - Passes through any CLI args (--dry-run, --max-briefs N, --brief-id UUID)
#
# Suggested cron entry:
#   */5 * * * * /opt/google-ads-auditor/run_content_briefs.sh

cd /opt/google-ads-auditor || exit 1

# Extract env vars individually (avoids multi-line-source issues with JSON values)
export SUPABASE_URL=$(grep '^SUPABASE_URL=' .env | cut -d= -f2-)
export SUPABASE_SERVICE_ROLE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env | cut -d= -f2-)
export ANTHROPIC_API_KEY=$(grep '^ANTHROPIC_API_KEY=' .env | cut -d= -f2-)

# Allow overriding the prompts dir (default: /opt/google-ads-auditor/brief_prompts)
export BRIEF_PROMPTS_DIR="${BRIEF_PROMPTS_DIR:-/opt/google-ads-auditor/brief_prompts}"

mkdir -p logs
LOGFILE="logs/process_content_briefs_$(date -u +%Y%m%d).log"
{
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) start args=$* ==="
  python3 process_content_briefs.py "$@"
  EXIT_CODE=$?
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) exit=$EXIT_CODE ==="
  exit $EXIT_CODE
} >> "$LOGFILE" 2>&1
