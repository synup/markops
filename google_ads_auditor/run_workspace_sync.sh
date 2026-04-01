#!/bin/bash
# ============================================================
# Workspace User Sync — daily import from Google Workspace
# ============================================================
# Cron: 0 2 * * * /opt/google-ads-auditor/run_workspace_sync.sh
#
# Syncs Google Workspace users into es_workspace_users table.
# Checks es_settings.auto_import_enabled before running.
# Logs to /opt/google-ads-auditor/logs/workspace_sync_YYYY-MM-DD.log
# ============================================================

set -euo pipefail

cd /opt/google-ads-auditor

# Create logs dir if missing
mkdir -p logs

LOGFILE="logs/workspace_sync_$(date +%Y-%m-%d).log"

# Load environment variables
set -a
source .env
set +a

# Activate virtual environment
source venv/bin/activate

echo "============================================================" >> "$LOGFILE"
echo "  WORKSPACE USER SYNC — $(date)" >> "$LOGFILE"
echo "============================================================" >> "$LOGFILE"

python -m google_ads_auditor.fetch_workspace_users >> "$LOGFILE" 2>&1

echo "" >> "$LOGFILE"
echo "Finished at $(date)" >> "$LOGFILE"
echo "============================================================" >> "$LOGFILE"
