#!/bin/bash
# Weekly audit cron script for DigitalOcean droplet
# Add to crontab: 0 9 * * 5 /opt/google-ads-auditor/run_weekly_audit.sh
# Runs every Friday at 9 AM (droplet timezone)

set -e

PROJECT_DIR="/opt/google-ads-auditor"
VENV="$PROJECT_DIR/venv/bin/python"
REPORTS_DIR="$PROJECT_DIR/reports"
PUSH_SCRIPT="$PROJECT_DIR/push_to_supabase.py"

# Load environment variables
source "$PROJECT_DIR/.env"
export SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY

echo "[$(date)] Starting weekly Google Ads audit..."

# Run the auditor (JSON only — no email, no PDF/Excel needed)
cd "$PROJECT_DIR"
$VENV -m google_ads_auditor.run_audit --json-only 2>&1

# Find the latest report
LATEST=$(ls -t "$REPORTS_DIR"/google_ads_audit_*.json 2>/dev/null | head -1)

if [ -z "$LATEST" ]; then
    echo "[$(date)] ERROR: No report file found!"
    exit 1
fi

echo "[$(date)] Report generated: $LATEST"

# Push to Supabase
$VENV "$PUSH_SCRIPT" "$LATEST"

echo "[$(date)] Audit complete and pushed to Supabase!"
