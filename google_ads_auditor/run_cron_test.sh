#!/bin/bash
# ============================================================
# Google Ads Auditor - Test Script
# ============================================================
# Runs a dry-run audit to test everything works:
#   - Python environment
#   - Email delivery (with sample data)
#   - Report generation
#
# Usage:
#   chmod +x run_cron_test.sh
#   ./run_cron_test.sh
# ============================================================

set -euo pipefail

cd /opt/google-ads-auditor

# Load environment variables
set -a
source .env
set +a

# Activate virtual environment
source venv/bin/activate

echo "============================================================"
echo "  RUNNING TEST AUDIT (dry-run with sample data)"
echo "============================================================"
echo ""

# Run with dry-run flag (uses sample data, but WILL send email if configured)
python -m google_ads_auditor.run_audit \
    --dry-run \
    --output-dir /opt/google-ads-auditor/reports

echo ""
echo "============================================================"
echo "  TEST COMPLETE"
echo ""
echo "  Check:"
echo "  1. Reports in /opt/google-ads-auditor/reports/"
echo "  2. Your email inbox for the test report"
echo "============================================================"
