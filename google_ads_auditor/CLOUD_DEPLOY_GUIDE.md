# Cloud Deployment Guide - Google Ads Auditor

## Architecture

```
Cloud Scheduler (Fri 9 AM EST)
        |
        v  HTTP POST
  Google Cloud Run (container)
        |
        +--> Google Ads API (fetch data)
        +--> Run 74-check audit
        +--> Generate JSON + Excel + PDF
        +--> Email via Gmail SMTP
        +--> POST webhook to MarkOps dashboard (optional)
```

## Prerequisites

1. A Google Cloud Platform (GCP) project with billing enabled
2. `gcloud` CLI installed and authenticated
3. Your Google Ads API credentials
4. A Gmail App Password for email delivery

## Step 1: Set Environment Variables

Export your credentials as environment variables. These will be passed securely to Cloud Run:

```bash
export GCP_PROJECT_ID="your-gcp-project-id"
export GCP_REGION="us-east1"

# Google Ads API
export GOOGLE_ADS_DEVELOPER_TOKEN="your-dev-token"
export GOOGLE_ADS_CLIENT_ID="your-client-id"
export GOOGLE_ADS_CLIENT_SECRET="your-client-secret"
export GOOGLE_ADS_REFRESH_TOKEN="your-refresh-token"
export GOOGLE_ADS_CUSTOMER_ID="1234567890"

# Email
export GMAIL_SENDER_EMAIL="your-email@example.com"
export GMAIL_RECIPIENT_EMAIL="recipient@example.com"
export GMAIL_APP_PASSWORD="your-gmail-app-password"

# Optional: Webhook for MarkOps dashboard
export AUDIT_WEBHOOK_URL="https://your-markops-dashboard.com/api/webhook/audit"
```

## Step 2: Deploy

```bash
cd google_ads_auditor
chmod +x deploy.sh
./deploy.sh
```

This single script:
- Enables required GCP APIs
- Builds the Docker container via Cloud Build
- Deploys to Cloud Run
- Creates a service account for scheduled invocations
- Sets up Cloud Scheduler to trigger every Friday at 9 AM EST

## Step 3: Test

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe google-ads-auditor \
  --region us-east1 --format "value(status.url)")

# Test with sample data
curl -X POST "${SERVICE_URL}/run?dry_run=true" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)"

# Test the API endpoint
curl "${SERVICE_URL}/api/audit?dry_run=true" \
  -H "Authorization: Bearer $(gcloud auth print-identity-token)"
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/run` | POST | Run full audit (triggered by Cloud Scheduler) |
| `/api/audit` | GET | Run audit and return JSON (for dashboard) |
| `/api/latest` | GET | Return most recent cached JSON report |

### Query Parameters

- `?dry_run=true` — Use sample data (no API calls)
- `?no_email=true` — Skip email delivery
- `?json_only=true` — Only generate JSON (skip Excel/PDF)

## MarkOps Dashboard Integration

You have three options to connect this to your dashboard:

### Option A: Webhook Push (recommended)

Set `AUDIT_WEBHOOK_URL` and the auditor will POST the full JSON result to your dashboard after every run. Your dashboard just needs a single endpoint to receive it.

Example payload your dashboard receives:
```json
{
  "meta": { "version": "1.0.0", "generated_at": "2026-03-07T09:00:12" },
  "health_score": { "overall": 67.7, "grade": "C", "passed": 52, "failed": 19 },
  "categories": { ... },
  "critical_issues": [ ... ],
  "search_terms": { "wasted_spend": 5520.00, "negative_candidates": [...] },
  "all_checks": [ ... ]
}
```

### Option B: API Pull

Your dashboard polls `GET /api/latest` or `GET /api/audit` on demand. Use `/api/latest` for cached results (fast) or `/api/audit` for a fresh run.

### Option C: Shared Database (future)

When your MarkOps dashboard tech stack is finalized, add a database writer module that stores audit results in Postgres/MySQL/BigQuery. The JSON schema is already structured for this.

## Updating

To redeploy after code changes:

```bash
./deploy.sh
```

The script is idempotent — it will update the existing service.

## Cost Estimate

- **Cloud Run**: ~$0.00-0.05/month (runs for ~2 min once/week, well within free tier)
- **Cloud Scheduler**: Free (up to 3 jobs)
- **Cloud Build**: Free tier covers 120 min/day
- **Total**: Effectively free for a weekly cron job

## Troubleshooting

**View logs:**
```bash
gcloud run services logs read google-ads-auditor --region us-east1
```

**Test locally:**
```bash
docker build -t ads-auditor .
docker run -p 8080:8080 \
  -e GOOGLE_ADS_DEVELOPER_TOKEN=... \
  -e GOOGLE_ADS_CUSTOMER_ID=... \
  ads-auditor
```

**Manual trigger:**
```bash
gcloud scheduler jobs run google-ads-auditor-weekly --location us-east1
```
