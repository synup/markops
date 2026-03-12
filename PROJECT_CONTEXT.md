# Marketing HQ — Project Context

> Updated end of session 2026-03-12. This file is the single source of truth for continuing work on this project.

## What This Is

**Marketing HQ** is Synup's internal marketing operations dashboard. It's the hub for all marketing tools, starting with a Google Ads auditor that runs on-demand or on a user-configured schedule, presenting actionable recommendations.

## Architecture

| Component | Tech | Location | Purpose |
|-----------|------|----------|---------|
| Dashboard | Next.js 15 + TypeScript + Tailwind | Vercel | UI for team (@synup.com only) |
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
│   │   │   │   ├── audit/     ← Adwords audit view (5 tabs: Search Terms, Negatives, Expansion, Pause, Issues)
│   │   │   │   ├── campaigns/ ← Campaign analytics (pulls from campaign_metrics or audit report fallback)
│   │   │   │   ├── keywords/  ← Negative keyword management
│   │   │   │   └── settings/  ← User profile + Audit Scheduler + User Management (admin only)
│   │   │   └── api/auth/      ← OAuth callback
│   │   ├── components/
│   │   │   ├── ui/            ← Reusable UI atoms (ScoreGauge, StatCard, etc.)
│   │   │   ├── layout/        ← Sidebar, Topbar
│   │   │   └── features/
│   │   │       ├── audit/     ← AuditScoreHeader, AuditTriggerButton, SearchTermsPanel, SearchTermRow, ExpansionPanel, PausePanel
│   │   │       ├── campaigns/ ← CampaignTable
│   │   │       ├── keywords/  ← NegativeKeywordRow, NegativeKeywordsList, KeywordExpansionRow
│   │   │       ├── schedule/  ← ScheduleDisplay, ScheduleForm, TimezoneSelect
│   │   │       └── users/     ← UserManagement, UserRow
│   │   ├── hooks/             ← useAuth, useAuditData, useAuditTrigger, useAuditSchedule, useCampaigns, useSearchTerms, useUsers
│   │   ├── lib/supabase/      ← Supabase client configs (browser, server, admin)
│   │   └── types/             ← TypeScript interfaces
│   ├── supabase/
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql       ← 7 tables + RLS + auth trigger
│   │   │   ├── 002_search_terms_and_audit_requests.sql ← 3 tables (audit_requests, search_terms, search_term_summaries)
│   │   │   ├── 003_audit_schedules.sql      ← 1 table (audit_schedules)
│   │   │   └── 004_admin_and_campaigns.sql  ← Set niladri as admin + admin RLS policies
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

## Database Tables (12 total, 4 migrations)

| Table | Purpose | Written By |
|-------|---------|-----------|
| `profiles` | User info (auto-created on signup, role: admin/editor/viewer) | Supabase Auth trigger |
| `audit_runs` | Audit scores, categories, issues, raw_report JSON | Droplet (service_role) |
| `negative_keywords` | Candidate terms to block | Droplet (service_role) |
| `keyword_expansions` | Candidate terms to add | Droplet (service_role) |
| `keywords_to_pause` | Underperforming keywords | Droplet (service_role) |
| `campaign_metrics` | Daily campaign snapshots (not yet populated) | Droplet (service_role) |
| `change_log` | History of pushed changes | Dashboard users |
| `audit_requests` | On-demand audit triggers | Dashboard users → droplet processes |
| `search_terms` | All search terms with type classification | Droplet (service_role) |
| `search_term_summaries` | Per-run search term rollups | Droplet (service_role) |
| `audit_schedules` | User-configured recurring audit schedules | Dashboard users → droplet checks |

## User Roles & Access

- **Admin**: Can view all users, change roles, manage schedules. niladri@synup.com is admin.
- **Editor**: Can approve/deny keyword candidates (future).
- **Viewer**: Read-only dashboard access. Default role for new signups.
- **Self-service join**: Any @synup.com user can visit the app URL and sign in with Google. Auto-created as Viewer.

## Supabase Project

- **Project name**: Adwords
- **URL**: `https://bgxgukkriymmtlzkkjkg.supabase.co`
- **All 4 migrations have been run** (001, 002, 003, 004)
- **Google OAuth configured** with @synup.com domain restriction

## Droplet Setup

- **IP**: `167.71.229.75` (Ubuntu 22.04, Bangalore)
- **Project dir**: `/opt/google-ads-auditor`
- **Deployed scripts**: `push_to_supabase.py`, `poll_audit_requests.py`
- **Cron**: `*/5 * * * *` polls for on-demand + scheduled audits
- **Swap**: 1GB swap file added (droplet only has 1GB RAM)
- **Env vars in `/opt/google-ads-auditor/.env`**: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_LOGIN_CUSTOMER_ID, plus Google Ads OAuth credentials
- **Google Ads account**: Synup USA - Agency (185 campaigns, 36,896 keywords)
- **Patch applied**: `google_ads_client.py` line ~371 — added `campaign.status` to fetch_extensions SELECT clause

## Current State (2026-03-12)

### Completed
- Next.js project scaffolded with all core files
- Supabase database with 12 tables (4 migrations run)
- Google OAuth working (tested — login successful)
- Dashboard pages: Home, Audit (5 tabs), Campaigns, Keywords, Settings
- Data hooks: useAuth, useAuditData, useAuditTrigger, useAuditSchedule, useCampaigns, useSearchTerms, useUsers
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

### Not Yet Done
- [ ] Vercel deployment
- [ ] Push-to-Ads feature (approve keyword → actually push to Google Ads API)
- [ ] Live campaign metrics fetcher (daily cron on droplet to populate campaign_metrics table)
- [ ] Changelog / commit overlay UI (from legacy HTML)
- [ ] Clawbot API documentation
- [ ] Score showing 0/100 in push output (health_score path may differ in live JSON vs dry-run)

### Known Issues
- `push_to_supabase.py` reported score as 0/100 even though audit scored 62.5 — the `health_score.score` path in the live JSON may differ from the dry-run format. Needs investigation.
- Gmail App Password on droplet is only 10 chars (needs 16) — but email is no longer needed
- `.DS_Store` committed to repo — should be cleaned
- Legacy `Downloads/Adwords auditor/` path in repo should be restructured
- `campaign_metrics` table not yet populated (campaigns page falls back to audit report data)

## Key Credentials & Infra

| What | Where |
|------|-------|
| GitHub repo | `github.com/synup/markops` |
| DO Droplet | `167.71.229.75` (Ubuntu 22.04, $6/mo, Bangalore) |
| Droplet project dir | `/opt/google-ads-auditor` |
| Google Ads OAuth | Desktop app credentials in droplet `.env` |
| Google Ads Account | Synup USA - Agency (Customer ID in droplet `.env`) |
| Supabase project | `https://bgxgukkriymmtlzkkjkg.supabase.co` (project: Adwords) |
| Vercel deployment | Previous: `markops-h2j4qn70y-synups-projects.vercel.app` (needs redeploy) |

## Rules for Future Sessions
1. **Components < 150 lines** — split if exceeding
2. **UI separate from logic** — hooks for data, components for display
3. **Save context** — update this file and push to GitHub at end of every session
4. **Use subagents** — for exploration, research, multi-file analysis
5. **Return summaries** — not raw data from subagents
6. **Keep droplet** — it runs the Python auditor + poller (not GitHub Actions)
7. **Credentials in .env only** — never in config files or chat
