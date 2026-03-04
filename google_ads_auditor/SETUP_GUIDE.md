# Google Ads Weekly Auditor - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
pip install google-ads google-auth google-auth-oauthlib openpyxl reportlab pyyaml
```

### 2. Configure Credentials

Edit `config/config.yaml` with your details:

**Google Ads API** (from [Google Ads API Center](https://ads.google.com/aw/apicenter)):
- `developer_token` - Your Google Ads developer token
- `client_id` - OAuth2 Client ID from Google Cloud Console
- `client_secret` - OAuth2 Client Secret
- `refresh_token` - OAuth2 refresh token (generate via `google-oauthlib-tool`)
- `customer_id` - Your Google Ads account ID (no dashes)

**Gmail** (for email delivery):
- `gmail_app_password` - Generate at https://myaccount.google.com/apppasswords (requires 2FA)

### 3. Run the Audit

```bash
# Live audit with email
python -m google_ads_auditor.run_audit

# Test with sample data (no API needed)
python -m google_ads_auditor.run_audit --dry-run --no-email

# Custom config path
python -m google_ads_auditor.run_audit --config /path/to/config.yaml
```

## What Gets Audited (74 Checks)

| Category | Weight | Checks | Focus |
|----------|--------|--------|-------|
| Conversion Tracking | 25% | 11 | Enhanced conversions, consent mode, attribution |
| Wasted Spend | 20% | 8 | Negative keywords, search term waste, broad match |
| Account Structure | 15% | 12 | Campaign org, brand/non-brand, naming |
| Keywords & QS | 15% | 8 | Quality Score, CTR, zombie keywords |
| Ads & Assets | 15% | 17 | RSA strength, extensions, PMax asset groups |
| Settings & Targeting | 10% | 18 | Bidding strategy, budget, impression share |

## Grading Scale

- **A (90-100)**: Excellent
- **B (75-89)**: Good
- **C (60-74)**: Needs Improvement
- **D (40-59)**: Poor
- **F (<40)**: Critical

## Report Outputs

### Excel (.xlsx) - 8 tabs:
1. **Dashboard** - Overall score, grade, category chart
2. **Category Details** - All checks organized by category
3. **Failed Checks** - Prioritized list of failures
4. **Quick Wins** - Fixes under 15 minutes
5. **Search Term Report** - Wasted spend analysis
6. **Negative Keyword Suggestions** - Candidates for review
7. **Keyword Expansion** - Converting terms not yet as keywords
8. **All Checks (74)** - Complete audit trail

### PDF - Executive summary with:
- Health score and grade
- Category breakdown table
- Critical issues list
- Quick wins
- Search term analysis
- Negative keyword suggestions

## Automated Schedule

The audit is scheduled to run **every Friday at 9:00 AM** via Google Cloud Scheduler (see `CLOUD_DEPLOY_GUIDE.md`), or locally via cron/Task Scheduler.

## Generating a Google Ads API Refresh Token

```bash
google-oauthlib-tool \
  --client-secrets client_secret.json \
  --scope https://www.googleapis.com/auth/adwords \
  --save
```

This opens a browser for OAuth consent. The refresh token is saved to `~/google-ads.yaml`.
