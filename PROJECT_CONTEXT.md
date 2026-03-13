# Marketing HQ — Project Context

> Updated end of session 2026-03-13. This file is the single source of truth for continuing work on this project.

## What This Is

**Marketing HQ** is Synup's internal marketing operations dashboard. It's the hub for all marketing tools, starting with a Google Ads auditor that runs on-demand or on a user-configured schedule, presenting actionable recommendations.

## Architecture

| Component | Tech | Location | Purpose |
|-----------|------|----------|---------|
| Dashboard | Next.js 15 + TypeScript + Tailwind | Vercel (`marketing-hq-nine.vercel.app`) | UI for team (@synup.com only) |
| Database | Supabase (PostgreSQL) | Supabase cloud | Stores audit results, campaign data, user profiles, schedules |
| Auditor | Python (google-ads library) | DO droplet (167.71.229.75) | 74-check Google Ads audit engine |
| Poller | poll_audit_requests.py (cron */5) | DO droplet | Polls for on-demand + scheduled audits every 5 min |
| Auth | Supabase Auth + Google OAuth | Supabase | Restricted to @synup.com emails |
| API | Supabase REST API | Supabase | For Clawbot / CEO daily data access (service_role key) |

## Repo Structure (synup/markops)

```
markops/
├── marketing-hq/              ← Next.js dashboard (this project)
│   ├── src/
│   │   ├── app/               ← Next.js App Router pages
│   │   │   ├── (auth)/login/  ← Google OAuth login
│   │   │   ├── (dashboard)/   ← Protected dashboard routes
│   │   │   │   ├── audit/     ← Adwords audit view (6 tabs: Search Terms, Negatives, Expansion, Pause, Issues, Activity Log)
│   │   │   │   ├── campaigns/ ← Campaign analytics (pulls from campaign_metrics or audit report fallback)
│   │   │   │   ├── keywords/  ← Negative keyword management
│   │   │   │   └── settings/  ← User profile + Audit Scheduler + User Management (admin only)
│   │   │   └── api/auth/      ← OAuth callback
│   │   ├── components/
│   │   │   ├── ui/            ← Reusable UI atoms (ScoreGauge, StatCard, StatusBadge, etc.)
│   │   │   ├── layout/        ← Sidebar, Topbar
│   │   │   └── features/
│   │   │       ├── audit/     ← AuditScoreHeader, AuditTriggerButton, SearchTermsPanel, SearchTermRow, ExpansionPanel, PausePanel, ActionLogPanel, ActionLogRow
│   │   │       ├── campaigns/ ← CampaignTable
│   │   │       ├── keywords/  ← NegativeKeywordRow, NegativeKeywordsList, KeywordExpansionRow
│   │   │       ├── schedule/  ← ScheduleDisplay, ScheduleForm, TimezoneSelect
│   │   │       └── users/     ← UserManagement, UserRow
│   │   ├── hooks/             ← useAuth, useAuditData, useAuditTrigger, useAuditSchedule, useCampaigns, useSearchTerms, useUsers, useKeywordActions
│   │   ├── lib/supabase/      ← Supabase client configs (browser, server, admin)
│   │   └── types/             ← TypeScript interfaces
│   ├── supabase/
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql       ← 7 tables + RLS + auth trigger
│   │   │   ├── 002_search_terms_and_audit_requests.sql ← 3 tables (audit_requests, search_terms, search_term_summaries)
│   │   │   ├── 003_audit_schedules.sql      ← 1 table (audit_schedules)
│   │   │   ├── 004_admin_and_campaigns.sql  ← Set niladri as admin + admin RLS policies
│   │   │   └── 005_keyword_action_log.sql   ← Audit trail table + decided_at column + insert policy safety
│   │   ├── push_to_supabase.py              ← Pushes audit JSON → Supabase (6 sections)
│   │   ├── poll_audit_requests.py           ← Polls for on-demand + scheduled audits
│   │   └── run_weekly_audit.sh              ← Legacy cron runner (replaced by scheduler)
│   └── SETUP_GUIDE.md
│
├── google_ads_auditor/        ← Python audit engine
│   ├── auditor.py             ← 74-check scoring engine
│   ├── run_audit.py           ← CLI orchestrator
│   ├── google_ads_client.py   ← Google Ads API client (patched: campaign.status in fetch_extensions SELECT)
│   ├── search_term_analyzer.py ← Negative keyword detection
│   ├── report_json.py         ← JSON output (consumed by Supabase pusher)
│   ├── report_excel.py        ← XLSX reports
│   ├── report_pdf.py          ← PDF executive summary
│   ├── email_sender.py        ← Gmail SMTP (currently unused)
│   └── config/config.yaml     ← Audit thresholds & settings (credentials via env vars)
│
└── marketing-hq-legacy/       ← Original static HTML dashboard (deprecated)
    └── index.html             ← 2,219-line monolith
```

## Design System

- **Theme**: Dark mode only
- **Brand color**: `#7C3AED` (purple)
- **Background**: `#0C0C0C` → `#141414` → `#1A1A1A` (3-level depth)
- **Text**: `#FFFFFF` / `#888888` / `#444444`
- **Status colors**: Green `#22C55E`, Red `#EF4444`, Yellow `#F59E0B`, Orange `#F97316`
- **Font**: System fonts (-apple-system, Inter)
- **Component rule**: No component > 150 lines. UI separated from logic via hooks.

## Database Tables (13 total, 5 migrations)

| Table | Purpose | Written By |
|-------|---------|-----------|
| `profiles` | User info (auto-created on signup, role: admin/editor/viewer) | Supabase Auth trigger |
| `audit_runs` | Audit scores, categories, issues, raw_report JSON | Droplet (service_role) |
| `negative_keywords` | Candidate terms to block (status: candidate→approved/denied→pushed) | Droplet (service_role) + Dashboard users |
| `keyword_expansions` | Candidate terms to add | Droplet (service_role) |
| `keywords_to_pause` | Underperforming keywords | Droplet (service_role) |
| `campaign_metrics` | Daily campaign snapshots (not yet populated) | Droplet (service_role) |
| `change_log` | History of pushed changes | Dashboard users |
| `audit_requests` | On-demand audit triggers | Dashboard users → droplet processes |
| `search_terms` | All search terms with type classification | Droplet (service_role) |
| `search_term_summaries` | Per-run search term rollups | Droplet (service_role) |
| `audit_schedules` | User-configured recurring audit schedules | Dashboard users → droplet checks |
| `keyword_action_log` | Audit trail: who did what, when, with undo support | Dashboard users |

## Approval Workflow

1. **Search Terms tab**: User reviews search terms, multi-selects negative/wasted spend candidates → "Add to Negative Candidates" button inserts into `negative_keywords` with status `candidate`
2. **Negative Keywords tab**: User reviews candidates, multi-selects → bulk "Approve All" or "Deny All" (or individual approve/deny)
3. **Activity Log tab**: Shows all actions with timestamps, user info, and undo buttons. Actions: added_as_candidate, approved, denied, bulk_approved, bulk_denied, undone, pushed_to_ads
4. **Push to Ads** (not yet built): Approved keywords get pushed to Google Ads API

## User Roles & Access

- **Admin**: Can view all users, change roles, manage schedules. niladri@synup.com is admin.
- **Editor**: Can approve/deny keyword candidates (future).
- **Viewer**: Read-only dashboard access. Default role for new signups.
- **Self-service join**: Any @synup.com user can visit the app URL and sign in with Google. Auto-created as Viewer.

## Supabase Project

- **Project name**: Adwords
- **URL**: `https://bgxgukkriymmtlzkkjkg.supabase.co`
- **Migrations 001–004 have been run**
- **Migration 005 needs to be run** (keyword_action_log table, decided_at column, insert policy)
- **Google OAuth configured** with @synup.com domain restriction
- **Redirect URLs**: `https://marketing-hq-nine.vercel.app/api/auth/callback` and `http://localhost:3000/api/auth/callback`

## Vercel Deployment

- **Production URL**: `https://marketing-hq-nine.vercel.app`
- **Project name**: `marketing-hq` (under Synup's projects)
- **Connected to GitHub**: `synup/markops` repo (auto-deploys on push)
- **Environment variables set**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (all environments)
- **Note**: `SUPABASE_SERVICE_ROLE_KEY` is NOT on Vercel (not needed — only used on droplet)

## Droplet Setup

- **IP**: `167.71.229.75` (Ubuntu 22.04, Bangalore)
- **Project dir**: `/opt/google-ads-auditor`
- **Deployed scripts**: `push_to_supabase.py`, `poll_audit_requests.py`
- **Cron**: `*/5 * * * *` polls for on-demand + scheduled audits
- **Swap**: 1GB swap file added (droplet only has 1GB RAM)
- **Env vars in `/opt/google-ads-auditor/.env`**: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_LOGIN_CUSTOMER_ID, plus Google Ads OAuth credentials
- **Google Ads account**: Synup USA - Agency (185 campaigns, 36,896 keywords)
- **Patch applied**: `google_ads_client.py` line ~371 — added `campaign.status` to fetch_extensions SELECT clause

## Current State (2026-03-13)

### Completed
- Next.js project scaffolded with all core files
- Supabase database with 12 tables (4 migrations run, migration 005 pending)
- Google OAuth working (tested — login successful on both localhost and Vercel)
- Dashboard pages: Home, Audit (6 tabs), Campaigns, Keywords, Settings
- Data hooks: useAuth, useAuditData, useAuditTrigger, useAuditSchedule, useCampaigns, useSearchTerms, useUsers, useKeywordActions
- Push-to-Supabase script with search terms support
- On-demand audit trigger (dashboard → audit_requests → droplet polls)
- Scheduler UI (frequency/day/time/timezone picker on Settings page)
- User management UI (admin-only, role promotion/demotion)
- Self-service join for @synup.com users (auto-created as Viewer)
- Poll script handles both on-demand and scheduled audits
- Live audit run successful (audit_run_id=3, score 62.5/100, 407 negative candidates, $894 wasted spend)
- Campaigns page with fallback to audit report data when campaign_metrics table is empty
- Droplet: 1GB swap added, cron active, all scripts deployed
- niladri@synup.com set as admin
- Vercel deployment live at `marketing-hq-nine.vercel.app`
- TypeScript build errors fixed: cookie types, audit history types, profile types
- Null safety fixes: `.single()` → `.maybeSingle()` across all Supabase queries
- JSON parsing safety: `categories`, `critical_issues`, `quick_wins` now handled as arrays or strings
- Auth callback improved: Shows specific error messages
- Security audit passed: No hardcoded secrets
- **Multi-select approval flow**: Search Terms → select candidates → "Add to Negative Candidates" (inserts as `candidate` status)
- **Negative Keywords multi-select**: Bulk approve/deny with floating action bar
- **Audit trail system**: `keyword_action_log` table, `useKeywordActions` hook (logAction, logBulkActions, undoAction), `useActionLog` hook
- **Activity Log UI**: New tab in Audit page showing all actions with timestamps, user names, undo buttons
- **Error feedback**: SearchTermsPanel shows error messages when inserts fail
- **decided_at tracking**: `useAuditData.updateStatus` now records `decided_by` and `decided_at`

### Not Yet Done
- [ ] **Run migration 005** in Supabase SQL Editor (keyword_action_log table + decided_at column)
- [ ] Push-to-Ads feature (approve keyword → actually push to Google Ads API)
- [ ] Live campaign metrics fetcher (daily cron on droplet to populate campaign_metrics table)
- [ ] Changelog / commit overlay UI (from legacy HTML)
- [ ] Clawbot API documentation
- [ ] Investigate why only 9 of 407 search terms were pushed to negative_keywords table
- [ ] Deploy latest changes to Vercel (push to GitHub triggers auto-deploy)

### Known Issues
- `campaign_metrics` table not yet populated (campaigns page falls back to audit report data)
- Gmail App Password on droplet is only 10 chars (needs 16) — but email is no longer needed
- Legacy `Downloads/Adwords auditor/` path in repo should be restructured
- Negative keywords are **campaign-level only** (no account-level shared lists in the current schema)

## Key Credentials & Infra

| What | Where |
|------|-------|
| GitHub repo | `github.com/synup/markops` |
| Vercel deployment | `marketing-hq-nine.vercel.app` (project: marketing-hq) |
| DO Droplet | `167.71.229.75` (Ubuntu 22.04, $6/mo, Bangalore) |
| Droplet project dir | `/opt/google-ads-auditor` |
| Google Ads OAuth | Desktop app credentials in droplet `.env` |
| Google Ads Account | Synup USA - Agency (Customer ID in droplet `.env`) |
| Supabase project | `https://bgxgukkriymmtlzkkjkg.supabase.co` (project: Adwords) |

## Session-Specific Fixes Applied

### 2026-03-12 (evening) — Vercel Deployment Session
1. TypeScript cookie types in middleware, server, callback
2. AuditHistory pick type for partial select
3. Profile card `null` vs `undefined` types
4. `.single()` → `.maybeSingle()` across all hooks
5. JSON array safety for categories/issues
6. Auth callback specific error messages

### 2026-03-13 — Multi-Select + Audit Trail Session
1. Multi-select SearchTermsPanel with floating action bar
2. SearchTermRow with checkbox, "Already Added" badge, click-to-select
3. NegativeKeywordsList with multi-select, bulk approve/deny, status filter
4. NegativeKeywordRow with checkbox for candidates
5. `keyword_action_log` table (migration 005) for full audit trail
6. `useKeywordActions` hook: logAction, logBulkActions, undoAction
7. `useActionLog` hook: fetches history with performer info
8. ActionLogPanel + ActionLogRow components: Activity Log tab with undo buttons
9. Error feedback in SearchTermsPanel for failed inserts
10. `decided_at` / `decided_by` tracking on keyword status updates

## Rules for Future Sessions
1. **Components < 150 lines** — split if exceeding
2. **UI separate from logic** — hooks for data, components for display
3. **Save context** — update this file and push to GitHub at end of every session
4. **Use subagents** — for exploration, research, multi-file analysis
5. **Return summaries** — not raw data from subagents
6. **Keep droplet** — it runs the Python auditor + poller (not GitHub Actions)
7. **Credentials in .env only** — never in config files or chat
8. **Use `.maybeSingle()`** — never `.single()` for Supabase queries that might return 0 rows
9. **Test locally before deploying** — run `npm run build` (or `npx tsc --noEmit`) to catch TypeScript errors before deploying
