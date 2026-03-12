# Marketing HQ — Setup Guide

Complete step-by-step guide to get the dashboard running.

## Prerequisites
- Node.js 18+ installed (`node --version`)
- A Supabase account (free tier works)
- The `synup/markops` GitHub repo cloned locally
- Your DigitalOcean droplet (167.71.229.75) still running

---

## Step 1: Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Name: `marketing-hq`
4. Database password: save this somewhere safe
5. Region: pick closest to your team (Mumbai or Singapore)
6. Click **Create new project** — wait ~2 minutes

### Get your keys:
- Go to **Settings → API**
- Copy: `Project URL` (this is `SUPABASE_URL`)
- Copy: `anon public` key (this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Copy: `service_role secret` key (this is `SUPABASE_SERVICE_ROLE_KEY`)

---

## Step 2: Run Database Migration

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy-paste the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run** (green button)
5. You should see "Success. No rows returned" — that's correct

---

## Step 3: Set Up Google OAuth in Supabase

### A. Google Cloud Console:
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Use your existing project (the one with Ads Auditor OAuth)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Type: **Web application**
6. Name: `Marketing HQ Dashboard`
7. Authorized redirect URIs: add your Supabase callback URL:
   ```
   https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
   ```
8. Click **Create** — copy the Client ID and Client Secret

### B. Supabase Dashboard:
1. Go to **Authentication → Providers**
2. Find **Google** and enable it
3. Paste your Client ID and Client Secret
4. Save

### C. Restrict to @synup.com:
The auth callback route in our app already rejects non-@synup.com emails.
The Google OAuth `hd` parameter also hints to Google to show only @synup.com accounts.

---

## Step 4: Install & Run the Dashboard Locally

```bash
# From your markops repo root
cd marketing-hq

# Install dependencies
npm install

# Create .env.local with your Supabase keys
cp .env.example .env.local
# Edit .env.local with your actual keys:
#   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
#   SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Run dev server
npm run dev
```

Open http://localhost:3000 — you should see the login page.

---

## Step 5: Deploy to Vercel

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# From the marketing-hq directory
vercel

# Follow prompts:
#   - Link to synup org
#   - Project name: marketing-hq
#   - Framework: Next.js (auto-detected)
```

### Add environment variables in Vercel:
1. Go to your project settings in Vercel dashboard
2. **Settings → Environment Variables**
3. Add these three:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Update Google OAuth redirect:
After deploying, add your Vercel domain to the Google OAuth authorized redirect URIs:
```
https://your-app.vercel.app/api/auth/callback
```

Also add it in Supabase:
1. **Authentication → URL Configuration**
2. Add your Vercel URL to **Redirect URLs**

---

## Step 6: Set Up Droplet Cron Job

SSH into your droplet:
```bash
ssh root@167.71.229.75
```

### A. Add Supabase credentials to .env:
```bash
nano /opt/google-ads-auditor/.env
```
Add these lines at the bottom:
```
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### B. Copy the push script:
```bash
# From your local machine, push the updated repo first
# Then on the droplet:
cd /opt/google-ads-auditor
git pull

# Copy push script into place
cp supabase/push_to_supabase.py .
cp supabase/run_weekly_audit.sh .
chmod +x run_weekly_audit.sh
```

### C. Test it:
```bash
# Run a dry-run audit first
source .env
cd /opt/google-ads-auditor
venv/bin/python -m google_ads_auditor.run_audit --dry-run --json-only

# Then push the result to Supabase
venv/bin/python push_to_supabase.py reports/google_ads_audit_*.json
```
Check your Supabase dashboard → Table Editor → `audit_runs` to confirm data appeared.

### D. Set up the cron job:
```bash
crontab -e
```
Add this line (runs every Friday at 9 AM server time):
```
0 9 * * 5 /opt/google-ads-auditor/run_weekly_audit.sh >> /var/log/audit_cron.log 2>&1
```

---

## Step 7: Verify End-to-End

1. Run `run_weekly_audit.sh` manually on the droplet
2. Check Supabase Table Editor — data should appear in `audit_runs`, `negative_keywords`, etc.
3. Open your deployed dashboard — you should see the audit data
4. Try approving/denying a negative keyword — it should update in Supabase

---

## Architecture Summary

```
┌─────────────────┐     ┌──────────────┐     ┌───────────────┐
│  DO Droplet     │────▶│  Supabase    │◀────│  Vercel       │
│  (weekly cron)  │     │  (database)  │     │  (dashboard)  │
│  Python auditor │     │  PostgreSQL  │     │  Next.js app  │
│                 │     │  Auth        │     │               │
│  push_to_supa   │     │  REST API    │     │  @synup.com   │
│  base.py        │     │              │     │  Google OAuth  │
└─────────────────┘     └──────┬───────┘     └───────────────┘
                               │
                        ┌──────▼───────┐
                        │  Clawbot /   │
                        │  CEO API     │
                        │  (service    │
                        │   role key)  │
                        └──────────────┘
```
