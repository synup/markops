#!/bin/bash
# Wrapper for fetch_sales_calls.py
# - Loads required env vars from /opt/google-ads-auditor/.env
# - Logs to /opt/google-ads-auditor/logs/fetch_sales_calls_<YYYYMMDD>.log
# - Passes through any CLI args to Python (--backfill-days N, --dry-run)

cd /opt/google-ads-auditor || exit 1

# Extract env vars individually (avoids multi-line-source issues with JSON values)
export SUPABASE_URL=$(grep '^SUPABASE_URL=' .env | cut -d= -f2-)
export SUPABASE_SERVICE_ROLE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' .env | cut -d= -f2-)
export SALESHQ_API_TOKEN=$(grep '^SALESHQ_API_TOKEN=' .env | cut -d= -f2-)

LOGFILE="logs/fetch_sales_calls_$(date -u +%Y%m%d).log"
{
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) start args=$* ==="
  python3 fetch_sales_calls.py "$@"
  EXIT_CODE=$?
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) exit=$EXIT_CODE ==="
  exit $EXIT_CODE
} >> "$LOGFILE" 2>&1
