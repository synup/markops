#!/bin/bash
# ============================================================
# Google Ads Auditor - Google Cloud Run Deployment Script
# ============================================================
# Prerequisites:
#   1. Google Cloud SDK installed (gcloud CLI)
#   2. A GCP project with billing enabled
#   3. Docker installed (or use Cloud Build)
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
# ============================================================

set -euo pipefail

# ---- CONFIGURATION (edit these) ----
PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"
REGION="${GCP_REGION:-us-east1}"
SERVICE_NAME="google-ads-auditor"
SCHEDULER_TIMEZONE="America/New_York"
SCHEDULER_CRON="0 9 * * 5"  # Every Friday at 9 AM EST

echo "============================================================"
echo "  Google Ads Auditor - Cloud Deployment"
echo "  Project: ${PROJECT_ID}"
echo "  Region:  ${REGION}"
echo "============================================================"

# Step 1: Enable required APIs
echo ""
echo "[1/5] Enabling GCP APIs..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    cloudscheduler.googleapis.com \
    secretmanager.googleapis.com \
    --project="${PROJECT_ID}"

# Step 2: Build and push container
echo ""
echo "[2/5] Building container with Cloud Build..."
gcloud builds submit \
    --tag "gcr.io/${PROJECT_ID}/${SERVICE_NAME}" \
    --project="${PROJECT_ID}" \
    .

# Step 3: Deploy to Cloud Run
echo ""
echo "[3/5] Deploying to Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
    --image "gcr.io/${PROJECT_ID}/${SERVICE_NAME}" \
    --platform managed \
    --region "${REGION}" \
    --memory 1Gi \
    --timeout 300 \
    --max-instances 1 \
    --no-allow-unauthenticated \
    --set-env-vars "GOOGLE_ADS_DEVELOPER_TOKEN=${GOOGLE_ADS_DEVELOPER_TOKEN:-}" \
    --set-env-vars "GOOGLE_ADS_CLIENT_ID=${GOOGLE_ADS_CLIENT_ID:-}" \
    --set-env-vars "GOOGLE_ADS_CLIENT_SECRET=${GOOGLE_ADS_CLIENT_SECRET:-}" \
    --set-env-vars "GOOGLE_ADS_REFRESH_TOKEN=${GOOGLE_ADS_REFRESH_TOKEN:-}" \
    --set-env-vars "GOOGLE_ADS_CUSTOMER_ID=${GOOGLE_ADS_CUSTOMER_ID:-}" \
    --set-env-vars "GMAIL_SENDER_EMAIL=${GMAIL_SENDER_EMAIL:-}" \
    --set-env-vars "GMAIL_RECIPIENT_EMAIL=${GMAIL_RECIPIENT_EMAIL:-}" \
    --set-env-vars "GMAIL_APP_PASSWORD=${GMAIL_APP_PASSWORD:-}" \
    --set-env-vars "AUDIT_WEBHOOK_URL=${AUDIT_WEBHOOK_URL:-}" \
    --project="${PROJECT_ID}"

# Get the service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" \
    --platform managed \
    --region "${REGION}" \
    --format "value(status.url)" \
    --project="${PROJECT_ID}")

echo "       Service URL: ${SERVICE_URL}"

# Step 4: Create a service account for Cloud Scheduler
echo ""
echo "[4/5] Setting up Cloud Scheduler service account..."
SA_NAME="auditor-scheduler"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Create SA if it doesn't exist
gcloud iam service-accounts describe "${SA_EMAIL}" --project="${PROJECT_ID}" 2>/dev/null || \
    gcloud iam service-accounts create "${SA_NAME}" \
        --display-name="Ads Auditor Scheduler" \
        --project="${PROJECT_ID}"

# Grant Cloud Run invoker role
gcloud run services add-iam-policy-binding "${SERVICE_NAME}" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/run.invoker" \
    --region="${REGION}" \
    --project="${PROJECT_ID}"

# Step 5: Create Cloud Scheduler job
echo ""
echo "[5/5] Creating Cloud Scheduler job (${SCHEDULER_CRON} ${SCHEDULER_TIMEZONE})..."

# Delete existing job if present
gcloud scheduler jobs delete "${SERVICE_NAME}-weekly" \
    --location="${REGION}" \
    --project="${PROJECT_ID}" \
    --quiet 2>/dev/null || true

gcloud scheduler jobs create http "${SERVICE_NAME}-weekly" \
    --location="${REGION}" \
    --schedule="${SCHEDULER_CRON}" \
    --time-zone="${SCHEDULER_TIMEZONE}" \
    --uri="${SERVICE_URL}/run" \
    --http-method=POST \
    --oidc-service-account-email="${SA_EMAIL}" \
    --project="${PROJECT_ID}"

echo ""
echo "============================================================"
echo "  DEPLOYMENT COMPLETE"
echo ""
echo "  Service URL:  ${SERVICE_URL}"
echo "  Schedule:     Every Friday at 9:00 AM EST"
echo ""
echo "  Endpoints:"
echo "    POST ${SERVICE_URL}/run           - Run full audit"
echo "    GET  ${SERVICE_URL}/api/audit      - Get fresh audit JSON"
echo "    GET  ${SERVICE_URL}/api/latest     - Get cached latest JSON"
echo "    GET  ${SERVICE_URL}/health         - Health check"
echo ""
echo "  Test manually:"
echo "    curl -X POST ${SERVICE_URL}/run?dry_run=true"
echo ""
echo "  Dashboard integration:"
echo "    Your MarkOps dashboard can call:"
echo "      GET ${SERVICE_URL}/api/audit"
echo "    Or set AUDIT_WEBHOOK_URL to push results to your dashboard"
echo "============================================================"
