#!/bin/bash
# ============================================================
# Google Ads Auditor - Digital Ocean Droplet Setup Script
# ============================================================
# Run this ON your Digital Ocean droplet after SSH-ing in.
#
# Usage:
#   chmod +x setup_droplet.sh
#   ./setup_droplet.sh
# ============================================================

set -euo pipefail

echo "============================================================"
echo "  Google Ads Auditor - Droplet Setup"
echo "============================================================"

# Step 1: System updates
echo ""
echo "[1/6] Updating system packages..."
apt-get update && apt-get upgrade -y

# Step 2: Install Python 3.11+ and pip
echo ""
echo "[2/6] Installing Python and dependencies..."
apt-get install -y python3 python3-pip python3-venv git cron

# Step 3: Create app directory and user
echo ""
echo "[3/6] Setting up application directory..."
mkdir -p /opt/google-ads-auditor
cd /opt/google-ads-auditor

# Step 4: Clone repo (will be filled in by user)
echo ""
echo "[4/6] Cloning from GitHub..."
if [ -d ".git" ]; then
    echo "       Repo already cloned, pulling latest..."
    git pull origin master
else
    echo "       MANUAL STEP: Run the following command:"
    echo "       git clone https://github.com/synup/markops.git /opt/google-ads-auditor"
    echo ""
    echo "       Then re-run this script."
    exit 1
fi

# Step 5: Set up Python virtual environment
echo ""
echo "[5/6] Setting up Python virtual environment..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Step 6: Create .env file template
echo ""
echo "[6/6] Creating environment file..."
if [ ! -f /opt/google-ads-auditor/.env ]; then
    cat > /opt/google-ads-auditor/.env << 'ENVEOF'
# ============================================================
# Google Ads Auditor - Environment Variables
# ============================================================
# Fill in your actual values below. This file is gitignored.

# Google Ads API Credentials
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=

# Email Settings
GMAIL_SENDER_EMAIL=
GMAIL_RECIPIENT_EMAIL=
GMAIL_APP_PASSWORD=

# Optional: Webhook for MarkOps dashboard
AUDIT_WEBHOOK_URL=
ENVEOF
    echo "       Created .env file at /opt/google-ads-auditor/.env"
    echo "       IMPORTANT: Edit this file with your actual credentials!"
else
    echo "       .env file already exists, skipping..."
fi

# Create the cron runner script
cat > /opt/google-ads-auditor/run_cron.sh << 'CRONEOF'
#!/bin/bash
# Cron wrapper for Google Ads Auditor
cd /opt/google-ads-auditor

# Load environment variables
set -a
source .env
set +a

# Activate virtual environment and run
source venv/bin/activate
python -m google_ads_auditor.run_audit --output-dir /opt/google-ads-auditor/reports 2>&1 | tee -a /opt/google-ads-auditor/logs/audit_$(date +%Y-%m-%d).log
CRONEOF
chmod +x /opt/google-ads-auditor/run_cron.sh

# Create logs directory
mkdir -p /opt/google-ads-auditor/logs
mkdir -p /opt/google-ads-auditor/reports

echo ""
echo "============================================================"
echo "  SETUP COMPLETE"
echo ""
echo "  Next steps:"
echo "  1. Edit your credentials:  nano /opt/google-ads-auditor/.env"
echo "  2. Test dry run:           /opt/google-ads-auditor/run_cron_test.sh"
echo "  3. Set up cron job:        crontab -e"
echo "     Add this line:"
echo '     0 9 * * 5 /opt/google-ads-auditor/run_cron.sh'
echo "     (Runs every Friday at 9 AM server time)"
echo "============================================================"
