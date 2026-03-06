# Google Ads Auditor — Complete Deployment Guide

A step-by-step guide for deploying the Google Ads Auditor to a Digital Ocean droplet, connected to your MarkOps GitHub repo.

---

## Overview of What We're Doing

1. Push the auditor code to the `synup/markops` GitHub repo
2. Connect your Google Ads API credentials
3. Set up a Digital Ocean droplet to run it automatically every Friday
4. Configure email notifications
5. Test everything end-to-end

---

## Step 1: Push Code to GitHub (synup/markops)

### 1A. Clone the MarkOps repo to your local machine

Open your terminal (Mac: Terminal app, Windows: Git Bash or PowerShell):

```bash
# Clone your MarkOps repo
git clone https://github.com/synup/markops.git
cd markops
```

### 1B. Copy the auditor code into the repo

Copy the entire `google_ads_auditor/` folder into the MarkOps repo. You can place it at the root level or in a subdirectory:

```bash
# Option A: As a top-level folder
cp -r /path/to/google_ads_auditor ./google_ads_auditor

# Option B: Inside a tools directory (if your repo has one)
mkdir -p tools
cp -r /path/to/google_ads_auditor ./tools/google_ads_auditor
```

### 1C. Make sure .gitignore is in place

The `.gitignore` file inside `google_ads_auditor/` already excludes sensitive files. Double-check it exists:

```bash
cat google_ads_auditor/.gitignore
```

You should see entries like `.env`, `config/*.local.*`, `reports/`, etc.

### 1D. Commit and push

```bash
git add google_ads_auditor/
git commit -m "Add Google Ads weekly auditor"
git push origin master
```

**Verify**: Go to https://github.com/synup/markops and confirm the `google_ads_auditor/` folder is there.

---

## Step 2: Get Your Google Ads API Credentials

You said you have a developer token — great! You also need OAuth2 credentials. Here's how to get everything:

### What You Need (5 values)

| Credential | Where to Get It | Example |
|---|---|---|
| Developer Token | Google Ads UI → Admin → API Center | `aBcDeFgHiJkLmNoP` |
| Client ID | Google Cloud Console | `123456.apps.googleusercontent.com` |
| Client Secret | Google Cloud Console | `GOCSPX-xxxxxx` |
| Refresh Token | OAuth2 flow (below) | `1//0xxxxx` |
| Customer ID | Google Ads UI (top right, no dashes) | `1234567890` |

### 2A. Get your Developer Token

1. Log into Google Ads at https://ads.google.com
2. Click **Admin** (wrench icon) → **API Center**
3. Your developer token is shown there. Copy it.

> If it says "Test Account" — that's okay for testing. For production data, you'll need to apply for Standard access (takes 1-3 business days).

### 2B. Create OAuth2 Credentials (Client ID + Client Secret)

1. Go to https://console.cloud.google.com
2. Create a new project (or use an existing one)
3. Enable the **Google Ads API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Google Ads API"
   - Click **Enable**
4. Create OAuth credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - If prompted, configure the OAuth consent screen first:
     - User Type: **Internal** (if using a Google Workspace account) or **External**
     - Fill in App name, User support email, Developer contact email
     - Add scope: `https://www.googleapis.com/auth/adwords`
     - Click **Save and Continue** through each step
   - Back on Credentials, click **+ CREATE CREDENTIALS** → **OAuth client ID**
   - Application type: **Desktop app** (not Web application)
   - Name: `Google Ads Auditor`
   - Click **Create**
5. Copy the **Client ID** and **Client Secret**

### 2C. Generate a Refresh Token

This is the trickiest part. Run this on your local machine:

```bash
# Install the Google auth library
pip install google-auth-oauthlib

# Run the token generator
python -c "
from google_auth_oauthlib.flow import InstalledAppFlow

flow = InstalledAppFlow.from_client_config(
    {
        'installed': {
            'client_id': 'YOUR_CLIENT_ID_HERE',
            'client_secret': 'YOUR_CLIENT_SECRET_HERE',
            'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
            'token_uri': 'https://oauth2.googleapis.com/token',
        }
    },
    scopes=['https://www.googleapis.com/auth/adwords']
)

flow.run_local_server(port=8080)
print()
print('=== YOUR REFRESH TOKEN ===')
print(flow.credentials.refresh_token)
print('========================')
"
```

This will:
1. Open a browser window
2. Ask you to log in with the Google account that manages your ads
3. Print the refresh token in the terminal

**Copy the refresh token** — you'll need it in Step 3.

### 2D. Find Your Customer ID

1. Log into Google Ads
2. Look at the top-right corner — you'll see a number like `123-456-7890`
3. Remove the dashes → `1234567890`

If you have an MCC (Manager) account:
- The **Customer ID** = the specific account you want to audit
- The **Login Customer ID** = your MCC account number (also remove dashes)

---

## Step 3: Set Up Digital Ocean Droplet

### 3A. Which Droplet to Buy

Go to https://cloud.digitalocean.com and create a Droplet:

| Setting | Recommended Value |
|---|---|
| **Region** | New York (NYC1) — closest to US East |
| **Image** | Ubuntu 22.04 LTS |
| **Plan** | Basic → Regular → **$6/month** (1 GB RAM, 1 vCPU, 25 GB SSD) |
| **Authentication** | SSH Key (recommended) or Password |
| **Hostname** | `markops-auditor` |

> The $6/month plan is more than enough. The auditor runs once a week for ~2 minutes and uses very little memory.

### 3B. Connect to Your Droplet

After creation, you'll get an IP address (e.g., `164.90.xxx.xxx`):

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP
```

### 3C. Clone the Repo and Run Setup

Once logged into the droplet:

```bash
# Clone your MarkOps repo
git clone https://github.com/synup/markops.git /opt/google-ads-auditor

# Navigate to the auditor directory
cd /opt/google-ads-auditor/google_ads_auditor

# Make scripts executable
chmod +x setup_droplet.sh run_cron_test.sh run_cron.sh

# If the auditor code is in a subdirectory of markops, adjust the path:
# cd /opt/google-ads-auditor/tools/google_ads_auditor
```

Since we cloned manually, let's set up the rest:

```bash
# Install Python and dependencies
apt-get update && apt-get install -y python3 python3-pip python3-venv git cron

# Create virtual environment
python3 -m venv /opt/google-ads-auditor/venv
source /opt/google-ads-auditor/venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create directories
mkdir -p /opt/google-ads-auditor/reports
mkdir -p /opt/google-ads-auditor/logs
```

### 3D. Add Your Credentials

Create the `.env` file with your actual credentials:

```bash
nano /opt/google-ads-auditor/.env
```

Paste this (replacing with YOUR values):

```
# Google Ads API Credentials
GOOGLE_ADS_DEVELOPER_TOKEN=your-actual-developer-token
GOOGLE_ADS_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=GOCSPX-your-secret
GOOGLE_ADS_REFRESH_TOKEN=1//0your-refresh-token
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_LOGIN_CUSTOMER_ID=9876543210

# Email Settings
GMAIL_SENDER_EMAIL=your-gmail@gmail.com
GMAIL_RECIPIENT_EMAIL=where-reports-go@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Optional: Webhook for MarkOps dashboard (leave empty for now)
AUDIT_WEBHOOK_URL=
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

### 3E. Set Up the Weekly Cron Job

```bash
# Open the cron editor
crontab -e
```

If asked to choose an editor, pick `1` (nano).

Add this line at the bottom:

```
0 9 * * 5 /opt/google-ads-auditor/run_cron.sh
```

This means: **Every Friday at 9:00 AM** (server time).

> **Time zone note**: Digital Ocean droplets default to UTC. If you want 9 AM EST, use `0 14 * * 5` (since EST = UTC-5). For EDT (summer), it's `0 13 * * 5`.

To set the server timezone to Eastern instead:

```bash
timedatectl set-timezone America/New_York
```

Save and exit: `Ctrl+O` → `Enter` → `Ctrl+X`

Verify cron is running:

```bash
crontab -l
# Should show: 0 9 * * 5 /opt/google-ads-auditor/run_cron.sh
```

---

## Step 4: Set Up and Test Email Notifications

### 4A. Verify Gmail App Password

You said you already have a Gmail App Password — make sure:

1. 2-Step Verification is ON for your Gmail account
2. The App Password is a 16-character code (like `abcd efgh ijkl mnop`)
3. When putting it in `.env`, remove the spaces: `GMAIL_APP_PASSWORD=abcdefghijklmnop`

### 4B. Test Email with Dry Run

On your droplet, run:

```bash
cd /opt/google-ads-auditor
source venv/bin/activate

# Load environment variables
set -a && source .env && set +a

# Run dry-run test (uses sample data but sends a real email)
python -m google_ads_auditor.run_audit --dry-run --output-dir /opt/google-ads-auditor/reports
```

You should see output like:

```
============================================================
  GOOGLE ADS WEEKLY AUDITOR
  Date: March 04, 2026 14:30
============================================================

[DRY RUN] Using sample data...
[2/7] Running 74-check audit...
       Score: 67.7/100 (Grade: C)
       Passed: 52/71
       Failed: 19
       Quick Wins: 3
[3/7] Analyzing search terms...
       Negative candidates: 7
       Wasted spend: $5,520.00
       Expansion candidates: 4
[4/7] Generating JSON output...
[5/7] Generating Excel report...
[6/7] Generating PDF report...
[7/7] Sending email report...
Report emailed to where-reports-go@gmail.com
```

**Check your email** — you should receive the audit report with Excel and PDF attachments.

### 4C. Troubleshooting Email Issues

If email fails:

| Error | Fix |
|---|---|
| `Authentication error` | Wrong App Password. Generate a new one at https://myaccount.google.com/apppasswords |
| `TLS negotiation unsuccessful` | Network issue. Try again. If persistent, check firewall: `ufw allow 587` |
| `SMTP error` | Check GMAIL_SENDER_EMAIL is correct |

---

## Step 5: Test Everything End-to-End

### 5A. Test with Sample Data (no Google Ads API needed)

```bash
cd /opt/google-ads-auditor
source venv/bin/activate
set -a && source .env && set +a

# Dry run — tests report generation + email
python -m google_ads_auditor.run_audit --dry-run
```

**Expected**: Score 67.7, Grade C, email received with Excel + PDF attachments.

### 5B. Test with Live Google Ads Data

```bash
# Live run — connects to your actual Google Ads account
python -m google_ads_auditor.run_audit
```

**Expected**: Your actual account data, real score, real recommendations.

If you get errors:

| Error | Fix |
|---|---|
| `Google Ads API error: DEVELOPER_TOKEN_NOT_APPROVED` | Your dev token is test-only. Apply for Standard access in Google Ads → Admin → API Center |
| `Google Ads API error: CUSTOMER_NOT_FOUND` | Wrong Customer ID. Check Google Ads UI for the correct number |
| `Google Ads API error: USER_PERMISSION_DENIED` | The Google account used for the refresh token doesn't have access to this Ads account |
| `invalid_grant` | Refresh token expired. Re-run the token generator from Step 2C |

### 5C. Test the Cron Job

Simulate what cron will do:

```bash
# Run the exact same script that cron will execute
/opt/google-ads-auditor/run_cron.sh
```

Check the log:

```bash
cat /opt/google-ads-auditor/logs/audit_$(date +%Y-%m-%d).log
```

### 5D. Verify Reports Were Generated

```bash
ls -la /opt/google-ads-auditor/reports/
```

You should see files like:

```
google_ads_audit_2026-03-04.xlsx
google_ads_audit_2026-03-04.pdf
google_ads_audit_2026-03-04.json
```

---

## Quick Reference: Important Paths on Your Droplet

| What | Path |
|---|---|
| App directory | `/opt/google-ads-auditor/` |
| Credentials | `/opt/google-ads-auditor/.env` |
| Reports | `/opt/google-ads-auditor/reports/` |
| Logs | `/opt/google-ads-auditor/logs/` |
| Virtual env | `/opt/google-ads-auditor/venv/` |
| Cron script | `/opt/google-ads-auditor/run_cron.sh` |

## Quick Reference: Useful Commands

```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Run manual audit
cd /opt/google-ads-auditor && source venv/bin/activate && set -a && source .env && set +a
python -m google_ads_auditor.run_audit

# Run dry-run test
python -m google_ads_auditor.run_audit --dry-run

# Run without email
python -m google_ads_auditor.run_audit --no-email

# JSON only (for dashboard)
python -m google_ads_auditor.run_audit --json-only

# Check cron schedule
crontab -l

# View latest log
cat /opt/google-ads-auditor/logs/audit_$(date +%Y-%m-%d).log

# Update code from GitHub
cd /opt/google-ads-auditor && git pull origin master
source venv/bin/activate && pip install -r requirements.txt
```

---

## Future: Connecting to MarkOps Dashboard

When your MarkOps dashboard is ready, you have two options:

**Option A: Webhook Push** — The auditor pushes results to your dashboard after each run:

```bash
# Edit .env and add your webhook URL
nano /opt/google-ads-auditor/.env
# Add: AUDIT_WEBHOOK_URL=https://your-markops-dashboard.com/api/webhook/audit
```

**Option B: API Pull** — Your dashboard pulls results from the auditor's JSON files. Set up a simple API endpoint on the droplet (the Flask server is included):

```bash
# Start the API server (in addition to cron)
source venv/bin/activate && set -a && source .env && set +a
gunicorn --bind 0.0.0.0:8080 google_ads_auditor.cloud_server:app --daemon

# Endpoints:
# GET http://YOUR_DROPLET_IP:8080/api/latest  — Latest audit JSON
# GET http://YOUR_DROPLET_IP:8080/health      — Health check
```
