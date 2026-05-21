# Marketing HQ — Project Context

> Updated end of session 2026-05-17. This file is the single source of truth for continuing work on this project.

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
| Reddit Research | Python (CrewAI agents) | DO droplet | 6-agent pipeline: RSS polling → scoring → tool specs → promotions → briefs |
| AI Visibility | Python (OpenAI + Anthropic APIs) | DO droplet | Queries LLMs for Synup + competitor mentions across 15 keywords, pending-run polling every 2 min |

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
│   │   │   │   ├── research/       ← Reddit Research (4 tabs: Tool Ideas, Content Ideas, Feed, Agents)
│   │   │   │   ├── ai-visibility/ ← AI Visibility Tracker (4 tabs: OpenAI Results, Claude Results, Keywords, Competitors)
│   │   │   │   └── settings/      ← User profile + Audit Scheduler + User Management (admin only)
│   │   │   └── api/
│   │   │       ├── auth/              ← OAuth callback
│   │   │       └── ai-visibility/run/ ← GET latest run status, POST trigger new run
│   │   ├── components/
│   │   │   ├── ui/            ← Reusable UI atoms (ScoreGauge, StatCard, StatusBadge, etc.)
│   │   │   ├── layout/        ← Sidebar, Topbar
│   │   │   └── features/
│   │   │       ├── audit/     ← AuditScoreHeader, AuditTriggerButton, SearchTermsPanel, SearchTermRow, ExpansionPanel, PausePanel, ActionLogPanel, ActionLogRow
│   │   │       ├── campaigns/ ← CampaignTable
│   │   │       ├── keywords/  ← GroupedKeywordRow, NegativeKeywordRow, NegativeKeywordsList, KeywordExpansionRow
│   │   │       ├── research/  ← 26 components: ToolIdeasList, ContentIdeasList, ToolIdeaRow, ContentIdeaRow, FeedTab, FeedSourceManager, FeedSourceRow, AddFeedForm, AgentsTab, AgentCard, AgentEditor, PipelineStatus, ResearchStatsHeader, ResearchActivityLog, SubredditSuggestionsList, ScoreBar, PostPreview, ReclassifyButton, ReclassifyToast, ScoreNowButton, GenerateButton, ToolSpecViewer, ContentBriefViewer, FeedbackSummary, ExportCsvButton, PromptSuggestions, BrandAlertBanner
│   │   │       ├── ai-visibility/ ← RunControls, SynupResultsTable, SynupRow, SynupRowHistory, CompetitorResultsTable, KeywordManager, KeywordRow, CompetitorManager, CompetitorRow, ExportCSVButton, LoadingSkeleton (11 components)
│   │   │       ├── schedule/  ← ScheduleDisplay, ScheduleForm, TimezoneSelect
│   │   │       └── users/     ← UserManagement, UserRow
│   │   ├── hooks/             ← useAuth, useAuditData, useAuditTrigger, useAuditSchedule, useCampaigns, useSearchTerms, useUsers, useKeywordActions, useRedditResearch (10 sub-hooks), useAIVisibility
│   │   ├── lib/supabase/      ← Supabase client configs (browser, server, admin)
│   │   └── types/             ← TypeScript interfaces
│   ├── supabase/
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql       ← 7 tables + RLS + auth trigger
│   │   │   ├── 002_search_terms_and_audit_requests.sql ← 3 tables (audit_requests, search_terms, search_term_summaries)
│   │   │   ├── 003_audit_schedules.sql      ← 1 table (audit_schedules)
│   │   │   ├── 004_admin_and_campaigns.sql  ← Set niladri as admin + admin RLS policies
│   │   │   ├── 005_keyword_action_log.sql   ← Audit trail table + decided_at column + insert policy safety
│   │   │   ├── 008_reddit_research.sql      ← 7 Reddit tables (feed_sources, posts, tool/content scores, tool/content actions, subreddit_suggestions, agent_configs) + RLS + indexes
│   │   │   ├── 008b_seed_reddit_feeds.sql   ← 10 subreddit + 20 keyword_search seed feeds
│   │   │   ├── 010_ai_visibility.sql        ← 3 tables (ai_visibility_keywords, ai_visibility_runs, ai_visibility_results) + RLS + indexes + updated_at trigger
│   │   │   ├── 010b_seed_ai_visibility_keywords.sql ← 15 seed keywords across 5 categories
│   │   │   └── 011_ai_visibility_config.sql ← Config table (key/value) for schedule frequency persistence
│   │   ├── push_to_supabase.py              ← Pushes audit JSON → Supabase (6 sections)
│   │   ├── poll_audit_requests.py           ← Polls for on-demand + scheduled audits
│   │   ├── fetch_ai_visibility.py           ← Queries GPT-4o + Claude Sonnet for 15 keywords, parses Synup + competitor mentions, writes to ai_visibility_results. Accepts --run-id for pending run pickup
│   │   ├── run_ai_visibility.sh             ← Cron wrapper: --check-pending mode (*/2) picks up pending runs; default mode checks schedule frequency from config table
│   │   └── run_weekly_audit.sh              ← Legacy cron runner (replaced by scheduler)
│   ├── MARKETING_HQ_USER_GUIDE.docx  ← End-user guide (9 sections: Getting Started, Dashboard, Audits, Keywords, Campaigns, API/Clawbot, Settings, Troubleshooting)
│   ├── MARKETING_HQ_ROADMAP.docx     ← Product roadmap + contributor best practices + AI assistant instructions (12 pages)
│   ├── CLAWBOT_API.md                ← REST API docs for CEO bot / Clawbot integration
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

## Database Tables (latest migration: 020_content_drafts)

| Table | Purpose | Written By |
|-------|---------|-----------|
| `profiles` | User info (auto-created on signup, role: admin/editor/viewer) | Supabase Auth trigger |
| `audit_runs` | Audit scores, categories, issues, raw_report JSON | Droplet (service_role) |
| `negative_keywords` | Candidate terms to block (status: candidate→approved/denied→pushed) | Droplet (service_role) + Dashboard users |
| `keyword_expansions` | Candidate terms to add | Droplet (service_role) |
| `keywords_to_pause` | Underperforming keywords | Droplet (service_role) |
| `campaign_metrics` | Daily campaign snapshots (backfilled 30 days, daily cron at 2am) | Droplet (service_role) |
| `change_log` | History of pushed changes | Dashboard users |
| `audit_requests` | On-demand audit triggers | Dashboard users → droplet processes |
| `search_terms` | All search terms with type classification | Droplet (service_role) |
| `search_term_summaries` | Per-run search term rollups | Droplet (service_role) |
| `audit_schedules` | User-configured recurring audit schedules | Dashboard users → droplet checks |
| `keyword_action_log` | Audit trail: who did what, when, with undo support | Dashboard users |
| `push_requests` | Push-to-Ads requests (pending→processing→completed/failed) | Dashboard → Droplet |
| `reddit_feed_sources` | Subreddit + keyword_search feeds (feed_type, enabled, post_count) | Dashboard users |
| `reddit_posts` | Collected Reddit posts (upvotes, num_comments, selftext, summary, enriched) | Droplet (reddit_rss_poller.py) |
| `reddit_tool_scores` | AI-scored tool ideas (composite_score/100, 5 sub-scores/10, tool_type, build_complexity) | Droplet (score_posts.py) |
| `reddit_content_scores` | AI-scored content ideas (composite_score/100, 5 sub-scores/10, icp_match, content_cluster) | Droplet (score_posts.py) |
| `reddit_tool_actions` | Approve/reject actions on tool ideas (linked by post_id) | Dashboard users |
| `reddit_content_actions` | Approve/reject actions on content ideas (linked by post_id) | Dashboard users |
| `reddit_subreddit_suggestions` | AI-suggested subreddits (status: suggested→approved/rejected) | Droplet → Dashboard |
| `reddit_agent_configs` | Agent system prompts with versioning (agent_name, agent_role, model, enabled) | Dashboard users |
| `reddit_feedback_log` | Tracks all approve/reject/reclassify actions with metadata | Dashboard (auto-logged) |
| `reddit_score_requests` | On-demand scoring triggers (pending→completed, polled by droplet) | Dashboard → Droplet |
| `reddit_spec_requests` | On-demand spec/brief generation triggers (request_type: tool_spec/content_brief, polled by droplet) | Dashboard → Droplet |
| `ai_visibility_keywords` | Keywords to query LLMs for (15 seeded, 5 categories, is_active toggle) | Dashboard users |
| `ai_visibility_runs` | Run metadata (status, models_queried, estimated_cost, trigger_source, schedule_frequency) | Droplet + Dashboard |
| `ai_visibility_results` | Per keyword × model × repetition results (synup_mentioned, synup_position, competitors_data JSONB) | Droplet (fetch_ai_visibility.py) |
| `ai_visibility_competitors` | Competitor names + variations text[] for case-insensitive matching (12 seeded) | Dashboard users |
| `ai_visibility_config` | Key/value config (schedule_frequency) for persisting schedule settings | Dashboard + shell script |
| `content_briefs` | Phase 3b: generated briefs for long-form asset types (blog_post / deep_article / use_case / collateral / tool). status pending → generating → ready/failed. NOT used for thought_leadership (Phase 3c content_drafts). | Approve API inserts pending row; Droplet (process_content_briefs.py) writes brief_content + flips to ready |
| `content_brief_prompts` | Phase 3b.5: DB-backed prompts (base + 5 asset types). Worker reads via `get_prompt()` with per-invocation cache; UI editor at `/conversations/brief-prompts` writes here. Generic `set_updated_at()` trigger lives here too (created in migration 019). | Editor UI + system seed (migration 019) |
| `content_drafts` | Phase 3c: short-form publish-ready drafts for `thought_leadership` asset type. author_voice CHECK in (sudy / roshan / niladri). status lifecycle mirrors content_briefs. | Approve API inserts pending row with `author_voice='niladri'` (v1 hardcode); Droplet (process_content_drafts.py) writes draft_content + flips to ready |
| `content_draft_prompts` | Phase 3c: DB-backed draft prompts (base + 3 author voices). Mirrors `content_brief_prompts` exactly. Edited via `/conversations/draft-prompts`. | Editor UI + system seed (migration 020) |

## Approval Workflow

1. **Search Terms tab**: User reviews search terms, multi-selects negative/wasted spend candidates → "Add to Negative Candidates" button inserts into `negative_keywords` with status `candidate`
2. **Negative Keywords tab**: User reviews candidates, multi-selects → bulk "Approve All" or "Deny All" (or individual approve/deny)
3. **Activity Log tab**: Shows all actions with timestamps, user info, and undo buttons. Actions: added_as_candidate, approved, denied, bulk_approved, bulk_denied, undone, pushed_to_ads
4. **Push to Ads**: Approved keywords get pushed to Google Ads API via `push_negatives_to_ads.py` (triggered from dashboard "Push to Ads" button → `push_requests` table → droplet polls and executes)

## User Roles & Access

- **Admin**: Can view all users, change roles, manage schedules. niladri@synup.com is admin.
- **Editor**: Can approve/deny keyword candidates (future).
- **Viewer**: Read-only dashboard access. Default role for new signups.
- **Self-service join**: Any @synup.com user can visit the app URL and sign in with Google. Auto-created as Viewer.

## Supabase Project

- **Project name**: Adwords
- **URL**: `https://bgxgukkriymmtlzkkjkg.supabase.co`
- **Migrations 001–011 have all been run** (009 = tally_leads, 010/010b = AI visibility, 011 = AI visibility config)
- **Google OAuth configured** with @synup.com domain restriction
- **Redirect URLs**: `https://marketing-hq-nine.vercel.app/api/auth/callback` and `http://localhost:3000/api/auth/callback`

## Vercel Deployment

- **Production URL**: `https://marketing-hq-nine.vercel.app`
- **Project name**: `marketing-hq` (under Synup's projects)
- **Connected to GitHub**: `synup/markops` repo (auto-deploys on push)
- **Environment variables set**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (all environments)
- **Note**: `SUPABASE_SERVICE_ROLE_KEY` is NOT on Vercel (not needed — only used on droplet)

## Branch State

Canonical branch: main. main and master were diverged from late March through 2026-05-17 (main had signature manager work, master had content-intelligence work — 57 unique main commits, 28 unique master commits). Consolidated into main on 2026-05-17 via direct merge of master into main. 7 conflicts resolved: .env.example, package.json/lock, globals.css, Sidebar.tsx, usePseoContent.ts add/add, types/index.ts. The dual-write convention (writing to both repo-root src/ AND Downloads/Adwords auditor/marketing-hq/src/) is DROPPED — /Users/niladri/src/ was a stale 24 Mar mirror tree that hadn't reflected any work since Phase 1. Main is now the single source of truth on disk and on GitHub.

## Phase 3 Status

### Phase 3a — SHIPPED (2026-05-17)

Phase 3a (Conversations review queue) SHIPPED 2026-05-17. Live at marketing-hq-nine.vercel.app/conversations. Light-theme review surface for call_insights from Phase 2 extraction. Approve/reject/revoke flow with optimistic UI, detail drawer, keyboard navigation, JustApprovedBanner with Undo. Architecture: 5 API routes under /api/conversations/ (GET list, PATCH approve/reject/revoke + requireAdmin helper at src/lib/auth/), 9 hooks (useUrlState, useConversations, useApprove, useReject, useRevoke, useDetailDrawer, useKeyboardNav, useConversationActions, useToast), 17 components under src/components/features/conversations/, 4 UI primitives (Button, Chip, ScoreBadge, Toast). Brief/draft generation deferred to Phase 3b/3c — Download brief and View draft buttons render disabled with placeholder tooltip.

### Phase 3b — SHIPPED (2026-05-19)

Phase 3b (brief generator for the 5 long-form asset types) shipped end-to-end on 2026-05-19. Live at marketing-hq-nine.vercel.app/conversations.

**Schema (migration 018):** `content_briefs` table — `id`, `call_insight_id` (FK to call_insights, ON DELETE CASCADE), `asset_type` CHECK in (`blog_post`, `deep_article`, `use_case`, `collateral`, `tool`) — explicitly NOT `thought_leadership` (that routes to Phase 3c `content_drafts` instead); `status` CHECK in (`pending`, `generating`, `ready`, `failed`); `brief_content` TEXT; `prompt_used` TEXT; `model_version` TEXT; `generation_metadata` JSONB (input_tokens/output_tokens/stop_reason/latency_ms); `error_message`; `retry_count` (informational); `ready_at`; plus `created_at`/`updated_at` with trigger. Indexes on `status` and `call_insight_id`.

**Prompts (`supabase/brief_prompts/`):** 6 markdown files — `base.md` (Synup voice, ICP, competitive landscape, voice/style rules) + 5 asset-type specs (`blog_post.md`, `deep_article.md`, `use_case.md`, `collateral.md`, `tool.md`). The worker reads these from disk per brief. To edit prompts: SCP updated files to `/opt/google-ads-auditor/brief_prompts/` — no worker restart needed (load happens per-brief). Phase 3b.5 backlog will move these to a DB-backed editor in the Agents tab (modeled on `reddit_agent_configs`).

**Worker (`supabase/process_content_briefs.py` on droplet):** stdlib-only Python (urllib, no anthropic SDK). Polls `content_briefs WHERE status='pending'` oldest first, `MAX_PER_RUN=10`. Claims rows via conditional PATCH (`id=eq.X&status=eq.pending` → `status='generating'`) so concurrent workers cannot double-pick. Joins `call_insights` + embedded `sales_calls!call_id(...)` for source context (customer, problem statement, marketing summary, verbatim quotes, asset rationale, suggested author, scores, attribution). System prompt = `base.md + <asset_type>.md`. Model `claude-sonnet-4-6`, `max_tokens=8192`, no extended thinking, no prompt caching. **Inline retry loop, 3 attempts** with backoffs `(0s, 30s, 60s)` — worst case ~90s of inline wait per failing brief; bounded so a bad row cannot freeze the queue or cause overlapping cron runs. `AuthError`/`RateLimitError` from Anthropic abort the run AND release the claimed row back to `'pending'` (operator-level failure, not the brief's fault — preserves retry budget). `FetchError`/`GenerationError` are inline-retried up to `MAX_ATTEMPTS`. After 3 failures: `status='failed'`, `error_message` populated, `retry_count=3` — terminal, admin reset required.

**Wrapper (`supabase/run_content_briefs.sh`):** mirrors `run_call_insights.sh` — extracts env vars individually from `.env`, defaults `BRIEF_PROMPTS_DIR=/opt/google-ads-auditor/brief_prompts`, logs to `logs/process_content_briefs_<YYYYMMDD>.log`.

**Cron:** `*/2 * * * * /opt/google-ads-auditor/run_content_briefs.sh` — every 2 minutes.

**Approve API (`src/app/api/conversations/[id]/approve/route.ts`):** after the `call_insights` update succeeds, if `approved_asset_type ∈ LONG_FORM_ASSET_TYPES` AND no pending/generating brief exists for `(call_insight_id, asset_type)`, INSERT a `content_briefs` row with `status='pending'`. **Best-effort** — any lookup or insert error is `console.error`-logged and swallowed; the user-facing approve response never fails because of a brief queue issue. `thought_leadership` is intentionally excluded from `LONG_FORM_ASSET_TYPES` (Phase 3c). **Revoke** (`src/app/api/conversations/[id]/revoke/route.ts`) does NOT cancel pending/generating briefs — accepted v1 inefficiency; future enhancement could DELETE pending briefs on revoke.

**Status endpoint (`GET /api/conversations/[id]/brief`):** returns most-recent brief row for a call_insight via `.maybeSingle()`. Response shape: `{ brief: { id, asset_type, status, chars, ready_at, output_tokens, has_content, error_message } | null }`. `chars` derived from `brief_content.length`; `output_tokens` derived from `generation_metadata.output_tokens`. `brief_content` is NEVER returned by this endpoint — content ships via `/download` only.

**Download endpoint (`GET /api/conversations/[id]/brief/download`):** returns most-recent `status='ready'` brief as a markdown attachment. Headers: `Content-Type: text/markdown; charset=utf-8`, `Content-Disposition: attachment; filename="brief-{asset_type}-{YYYYMMDD}.md"` (date from `ready_at` UTC), `Cache-Control: no-store`. 404 JSON `{error: 'No ready brief found for this insight'}` if no ready brief exists. 500 + `console.error` if a `'ready'` row somehow has null content (defensive).

**UI:**
- **`useConversationBrief(callInsightId, { enabled })` hook** — polls the status endpoint every 5s while `status ∈ {pending, generating}`; stops on `ready`/`failed`/`null`. AbortController + setTimeout cleanup on unmount/id change. `enabled: false` short-circuits (no fetch, no polling) — used to gate by tab.
- **`<ConversationBriefStatus callInsightId enabled />` component** — 4 visual states: amber pill "Queued for brief" (pending), amber pill with pulsing dot "Generating brief…" (generating), cyan button "Download brief ({pretty asset type})" (ready; programmatic anchor click against the /download endpoint), rose pill "Brief failed" with `error_message` in `title` (failed). Returns `null` when no brief exists yet.
- **Integration** — `InsightCard` (gated by `isApprovedTab` so polling only happens on the Approved tab) and `DrawerActions` (gated by `row.review_status === 'approved'`) both render the status component in place of the old disabled Download brief placeholder. Disabled "View brief" placeholder remains in both surfaces — in-app brief viewer is Phase 3b.5 scope.

**Filter persistence fix (bundled with 3b ship):** `useUrlState.setTab` now navigates to `?tab=X` directly instead of patching through `update()`, so `conversation_type`/`bracket`/`sort` all drop on tab switch. Fixes the "where's my row" wart where filters from one tab hid rows in the next. Sort dropping is intentional — simpler model, URL-shareable.

**Chevron affordance (bundled with 3b ship):** 20×20 inline SVG chevron-right at the right edge of each `InsightCard` bottom row, `text-slate-400` default → `text-slate-600` on `group-hover`. Lives outside the actions row's `stopPropagation` boundary so clicking it bubbles up to open the detail drawer. Visual cue that the card is interactive.

### Phase 3b.5 — SHIPPED (2026-05-20)

Phase 3b.5 (prompt editor + in-app brief viewer) shipped on 2026-05-20. Removes the SCP-to-droplet step from prompt iteration and adds an in-app surface for reading generated briefs.

**Schema (migration 019):** `content_brief_prompts` — `id`, `prompt_name` UNIQUE CHECK in (`base`, `blog_post`, `deep_article`, `use_case`, `collateral`, `tool`), `prompt_content`, `updated_by`, `updated_at` (trigger-managed), `created_at`. Generic `set_updated_at()` PL/pgSQL function created in this migration (`CREATE OR REPLACE`) so future tables can reuse it — migration 020's two tables already do. Seeded with the 6 current prompt files (byte-fidelity verified pre-commit).

**Worker switchover:** `supabase/process_content_briefs.py` now reads prompts from the table via a new `get_prompt(name)` helper backed by a module-level `_prompt_cache` (cached for one cron run; next run sees edits). Removed `load_base_prompt` / `load_asset_prompt` disk readers and the `BRIEF_PROMPTS_DIR` env var. Disk files in `supabase/brief_prompts/` retained as the canonical seed-source reference, no longer read at runtime. New `PromptNotFoundError` (terminal) vs `FetchError` (transient inline retry) classification.

**API endpoints:**
- `GET /api/brief-prompts` — returns all 6 prompts with `prompt_content` + server-computed `chars` + `updated_by` + `updated_at`. Used by the editor to load every row in one shot.
- `PATCH /api/brief-prompts/[name]` — validates `name` against the allowed set, validates `prompt_content` (non-empty string ≤ 100,000 chars), updates the row. `updated_by` precedence: body override → admin session `user.email` → literal `'admin'`. `updated_at` left to the migration 019 trigger.

**UI editor at `/conversations/brief-prompts`:** master-detail layout. Left pane (~30%): 6 prompts alphabetical, pretty-printed labels, relative `timeAgo` last-edited, cyan-500 left border + slate-100 bg on the selected row, amber dot when the row has unsaved edits. Right pane (~70%): monospace textarea (`min-h-500px`, `resize-y`), header with prompt name + last edited + char count, footer with amber "Unsaved changes" pill, Discard text button, cyan Save button (slate-200 when nothing to save), emerald "Saved {time}" pill that fades after 3s. `useBriefPrompts` hook holds a `pendingChanges` dict keyed by `prompt_name` so switching between prompts preserves edits. Page is a server component with `requireAdmin` via try/catch — non-admin users see an "Admin only" card instead of a 500.

**Sidebar restructure (bundled):** Conversations parent row became a collapsible group with a chevron toggle (stopPropagation on the chevron so it doesn't navigate). Children render below with `pl-10` indent (corrected from the literal `pl-8` spec — parent's `px-3` + 16px icon column put parent text at ≈36px, so `pl-8` would have read as un-indented). Default expanded, no localStorage. Route moved from `/agents/brief-prompts` → `/conversations/brief-prompts` to match the new nesting; old URL 404s. Used dark-theme tokens for the child active state (`var(--brand)` left border, `var(--surface-2)` bg, `var(--text)` label) rather than the literal `cyan-500` / `slate-100` from the spec — the sidebar is dark-themed, light-mode strip on dark chrome would clash.

**In-app brief viewer (bundled):** new `BriefViewerModal` (light-theme, `max-w-3xl`, `max-h-[85vh]`) renders `brief_content` via `react-markdown` (newly added dep, ~30 kB inline-imported into `/conversations`). Component map hand-styles `h1`/`h2`/`h3` per spec, `p` text-base + leading-relaxed, `ul`/`ol` with `pl-6` + space-y-1, `code` slate-100 bg, `strong` bold, links open in new tab. Three close paths: X button, Escape key, overlay click; modal body has `stopPropagation` so inside-clicks don't bubble.

Status endpoint extended with `?content=true` to opt into `brief_content` in the payload — UI uses it for the modal; default behavior (status + metadata only, no content) unchanged for the polling case. `DrawerActions` View brief button now active when `brief?.status === 'ready' && has_content`; otherwise disabled with `'Brief not ready yet'` tooltip.

### Phase 3c — SHIPPED (2026-05-21)

Phase 3c (`thought_leadership` draft pipeline) shipped on 2026-05-21. Parallel to the Phase 3b brief pipeline, adapted for short-form publish-ready social posts (target 150-280 words).

**Schema (migration 020):** Two new tables, both attaching `set_updated_at` from migration 019.
- `content_drafts` — `id`, `call_insight_id` (FK CASCADE), `author_voice` CHECK in (`sudy`, `roshan`, `niladri`), `status` CHECK in (`pending`, `generating`, `ready`, `failed`), `draft_content`, `prompt_used`, `model_version`, `generation_metadata` jsonb, `error_message`, `retry_count`, `ready_at`, `created_at`, `updated_at`. Indexes on `status` and `call_insight_id`.
- `content_draft_prompts` — mirrors `content_brief_prompts` exactly: `prompt_name` UNIQUE CHECK in (`base`, `sudy`, `roshan`, `niladri`), `prompt_content`, `updated_by`, timestamps. Seeded with the 4 prompt files (byte-fidelity verified pre-commit).

**Worker (`supabase/process_content_drafts.py` on droplet):** adapted from `process_content_briefs.py` via str-replace + 5 targeted manual edits. `MAX_TOKENS=2048` (down from 8192 — drafts are short). `VALID_AUTHOR_VOICES = ('sudy', 'roshan', 'niladri')` replaces `VALID_ASSET_TYPES`. `build_user_message` takes `author_voice` as a parameter (separate from `context`) and uses an "Author voice (assigned)" block instead of the briefs' "Approved asset type" + "Suggested author" sections — the row's voice is authoritative. Closing instruction rewritten for short-form publish-ready output. Same retry semantics: 3 attempts with 0/30/60s inline backoff, MAX_PER_RUN=10, claim-via-conditional-PATCH, AuthError/RateLimitError abort+release, PromptNotFoundError terminal, FetchError/GenerationError inline retry.

**Wrapper + cron:** `supabase/run_content_drafts.sh` mirrors `run_content_briefs.sh`. Cron `*/2 * * * * /opt/google-ads-auditor/run_content_drafts.sh`. Logs to `process_content_drafts_<YYYYMMDD>.log`.

**Approve API routing:** `approved_asset_type === 'thought_leadership'` now triggers an INSERT into `content_drafts` (parallel to the existing brief INSERT branch). v1 hardcodes `author_voice = 'niladri'` via a new `DRAFT_DEFAULT_VOICE` constant. Upgrade path: `call_insights.suggested_author` already exists with the same `sudy/roshan/niladri` value set — wire it to a per-approval voice picker once all 3 voices are tuned. Idempotency check includes `'ready'` (unlike briefs which check only pending/generating) — a successfully generated draft should not get re-queued on re-approve. Same best-effort semantics: failures logged + swallowed, never break the user approve.

**API endpoints:**
- `GET /api/conversations/[id]/draft` — most-recent `content_drafts` row, optional `?content=true` for the editor.
- `PATCH /api/conversations/[id]/draft` — updates `draft_content` on the most-recent `status='ready'` draft (SELECT-then-UPDATE since PostgREST can't `ORDER BY + LIMIT` on PATCH directly). 5,000-char cap (vs 100k on prompts). 404 if no ready draft. No `updated_by` tracking — column doesn't exist on `content_drafts`; future migration if multi-editor support comes later.

**UI dispatcher:** `InsightCard` and `DrawerActions` both branch on `row.approved_asset_type === 'thought_leadership'`:
- thought_leadership → `<ConversationDraftStatus>` (no View brief, no BriefViewerModal).
- long-form → existing brief flow unchanged.

`DrawerActions` also gates `useConversationBrief` so polling stops for thought_leadership rows.

**`ConversationDraftStatus` + `DraftEditorModal`:** same four visual states as the brief equivalent — amber "Queued for draft" / "Generating draft…" pills, cyan "View draft ({voice})" button when ready (opens the modal), rose "Draft failed" pill with `error_message` in `title`. The status component owns its modal internally (drop-in). Modal is `max-w-2xl` (smaller than brief viewer), light-theme, header has voice label + words/chars stats + emerald "Saved {time}" pip (3s fade), font-mono textarea (`min-h-400px`, `resize-y`, spellcheck on), footer with Copy-to-clipboard (left) + Unsaved-changes pill + Discard + Save (right). Three close paths with `window.confirm` gate when unsaved changes exist. Refactored into 3 files (modal + footer + `useDraftEditor` hook) to fit the 150-line cap per file.

**Draft prompts editor at `/conversations/draft-prompts`:** parallel implementation to brief prompts editor — `useDraftPrompts` hook, `DraftPromptsEditor` / `DraftPromptList` / `DraftPromptEditor` components. 4 prompts (Base/Niladri/Roshan/Sudy alphabetical). Sidebar gains a second child under Conversations, immediately below Brief prompts.

### Phase 3d — BACKLOG

- **Compliance dashboard.** Scope undefined. Needs a scoping conversation before implementation.

## Droplet Setup

- **IP**: `167.71.229.75` (Ubuntu 22.04, Bangalore)
- **Project dir**: `/opt/google-ads-auditor`
- **Deployed scripts (Ads)**: `push_to_supabase.py`, `poll_audit_requests.py`, `push_negatives_to_ads.py`, `fetch_campaign_metrics.py`
- **Deployed scripts (Reddit)**: `reddit_rss_poller.py`, `score_posts.py`, `generate_tool_specs.py`, `generate_promotions.py`, `generate_briefs.py` (in `/opt/reddit-research-tool/`)
- **Deployed scripts (AI Visibility)**: `fetch_ai_visibility.py`, `run_ai_visibility.sh`
- **Deployed scripts (Content briefs — Phase 3b)**: `process_content_briefs.py`, `run_content_briefs.sh`. (`brief_prompts/` directory still on droplet from Phase 3b ship — no longer read at runtime after Phase 3b.5; retained as seed-source reference only.)
- **Deployed scripts (Content drafts — Phase 3c)**: `process_content_drafts.py`, `run_content_drafts.sh`. Reads from `content_draft_prompts` table via the same get_prompt + cache pattern. No disk prompt directory needed.
- **Cron (Ads)**: `*/5 * * * *` polls for on-demand audits + scheduled audits + push-to-ads requests
- **Cron (Ads daily 2am)**: `fetch_campaign_metrics.py --days 1` (sources .env, logs to /var/log/campaign_metrics.log)
- **Cron (Reddit)**: 9 jobs — RSS poller (every 30min), score_posts (hourly), generate_tool_specs (every 2h), generate_promotions (every 4h), generate_briefs (every 4h), subreddit_suggester (daily), feed_enricher (every 6h), poll_score_requests (*/5), poll_spec_requests (*/5)
- **Cron (AI Visibility)**: `0 6 * * *` — daily 6am check via `run_ai_visibility.sh`, only runs if enough time elapsed based on schedule_frequency from config table (default: 2x-week = every 3 days)
- **Cron (AI Visibility pending)**: `*/2 * * * *` — `run_ai_visibility.sh --check-pending` polls for pending runs created by "Run Now" button, picks up and executes them
- **Cron (Content briefs — Phase 3b)**: `*/2 * * * *` — `run_content_briefs.sh` polls `content_briefs WHERE status='pending'` (MAX_PER_RUN=10), claims via conditional PATCH, generates brief via Claude Sonnet 4.6, writes brief_content + flips to `ready`. Inline retry 3x with 0/30/60s backoffs. Logs to `/opt/google-ads-auditor/logs/process_content_briefs_<YYYYMMDD>.log`
- **Cron (Content drafts — Phase 3c)**: `*/2 * * * *` — `run_content_drafts.sh` polls `content_drafts WHERE status='pending'` (MAX_PER_RUN=10), claims via conditional PATCH, generates draft via Claude Sonnet 4.6 with `max_tokens=2048`, writes draft_content + flips to `ready`. Same retry policy as briefs. Logs to `process_content_drafts_<YYYYMMDD>.log`
- **All 6 Reddit scripts read agent configs from Supabase** (`reddit_agent_configs` table) for system prompts, model, temperature. tool_builder and brief_builder upgraded to Sonnet.
- **Swap**: 1GB swap file added (droplet only has 1GB RAM)
- **Env vars in `/opt/google-ads-auditor/.env`**: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_ADS_CUSTOMER_ID, GOOGLE_ADS_LOGIN_CUSTOMER_ID, OPENAI_API_KEY, ANTHROPIC_API_KEY, plus Google Ads OAuth credentials
- **Google Ads account**: Synup USA - Agency (185 campaigns, 36,896 keywords)
- **Patch applied**: `google_ads_client.py` line ~371 — added `campaign.status` to fetch_extensions SELECT clause

## Current State (2026-03-23)

### Completed
- Next.js project scaffolded with all core files
- Supabase database with 24 tables (migrations 001-008b all run, reddit_score_requests + reddit_spec_requests created manually)
- Google OAuth working (tested — login successful on both localhost and Vercel)
- Dashboard pages: Home, Audit (8 tabs), Campaigns, Keywords, Research (4 tabs), AI Visibility (4 tabs), Settings
- Data hooks: useAuth, useAuditData, useAuditTrigger, useAuditSchedule, useCampaigns, useSearchTerms, useUsers, useKeywordActions, usePushToAds, useChangelog, useRedditResearch (11 sub-hooks), useAIVisibility
- Push-to-Supabase script with search terms support (key mismatch fixed)
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
- **9/407 bug fixed**: `push_to_supabase.py` was reading wrong JSON key (`negative_candidates` vs `negative_keyword_candidates`); also fixed for expansions; removed arbitrary caps (50/30)
- **Push-to-Ads**: `push_negatives_to_ads.py` script pushes approved negative keywords to Google Ads via `CampaignCriterionService.mutate_campaign_criteria()`; dashboard has "Push to Ads" button using `push_requests` polling table
- **Campaign metrics fetcher**: `fetch_campaign_metrics.py` fetches daily campaign snapshots from Google Ads API; supports backfill with `--days N`
- **Changelog tab**: Shows push history and change details with status badges
- **Clawbot API docs**: `CLAWBOT_API.md` documents all Supabase REST API endpoints for the CEO bot
- **User Guide**: `MARKETING_HQ_USER_GUIDE.docx` — 9-section guide covering sign-in, dashboard, audit workflow, keyword management, campaign metrics, API key generation, Clawbot integration, settings, and troubleshooting

### All Core Features Complete
- Migrations 006+007 run in Supabase
- All scripts deployed to droplet (push_negatives_to_ads.py, fetch_campaign_metrics.py, poll_audit_requests.py, push_to_supabase.py, report_json.py)
- Daily cron at 2am for campaign metrics (sources .env)
- Full audit re-run: 402 negative candidates, 7 expansion candidates, 409 search terms pushed (audit_run_id=10)
- Campaign metrics backfilled (30 days, 44 records)
- Vercel auto-deployed on git push
- Type casting fixes in push_to_supabase.py (int/float for Supabase integer/numeric columns)
- Search term key consistency fix (all objects have matching keys for Supabase bulk insert)
- fetch_campaign_metrics.py: fixed module import path + added env var overrides

### Reddit Research Page (2026-03-16)
- **Research page** at `/research` with 4 tabs: Tool Ideas, Content Ideas, Feed, Agents
- **"Reddit" in sidebar** navigation (between Keywords and Settings, icon: ◈)
- **useRedditResearch.ts** hook (~620 lines) with 10 sub-hooks:
  - `useScoreRequest()` — insert into reddit_score_requests, poll until completed
  - `useSpecRequest(type)` — insert into reddit_spec_requests (tool_spec or content_brief), poll until completed
  - `useBrandAlerts()` — unreviewed brand_mention posts (used by sidebar badge + alert banner)
  - `useToolIdeas()` — fetches tool scores with joined posts, approve/reject, reclassify to content with undo
  - `useContentIdeas()` — fetches content scores with joined posts, approve/reject, reclassify to tool with undo
  - `useFeedSources()` — CRUD on reddit_feed_sources, add/remove/toggle feeds
  - `useSubredditSuggestions()` — read/approve/reject AI-suggested subreddits, auto-add to feeds on approve
  - `useAgentConfigs()` — read agents, edit system prompts (version increment), enable/disable toggle
  - `useFeedbackSummary(agent_name)` — approval/rejection counts and rate per agent
  - `usePromptSuggestions(agent_name)` — pattern analysis on feedback for prompt improvement suggestions
  - `useResearchActivity()` — joins tool+content actions with post titles for activity log
  - `useResearchStats()` — count queries across all tables for stats header
- **26 components** (all under 150 lines) in `src/components/features/research/`:
  - Tool/Content Ideas: `ToolIdeasList`, `ContentIdeasList`, `ToolIdeaRow`, `ContentIdeaRow` — filter bar (All/Pending/Approved/Rejected with counts), score breakdowns (6 ScoreBars), approve/reject buttons, CSV export
  - Spec/Brief Viewers: `ToolSpecViewer` (error-boundary-wrapped modal for review_ready specs, smart object rendering, Markdown download), `ContentBriefViewer` (error-boundary-wrapped modal with collapsible channels for brief_complete briefs, Markdown download), `GenerateButton` (on-demand spec/brief generation)
  - Feed Management: `FeedTab`, `FeedSourceManager`, `FeedSourceRow`, `AddFeedForm` — CRUD for subreddit + keyword_search feeds, enable/disable toggle, post counts
  - Agents: `AgentsTab`, `AgentCard`, `AgentEditor`, `FeedbackSummary`, `PromptSuggestions` — view/edit agent system prompts with version tracking, feedback analysis, prompt improvement suggestions
  - Pipeline: `PipelineStatus` — visual 6-agent pipeline (Tool Track + Content Track)
  - Stats/Alerts: `ResearchStatsHeader` (6 stat cards), `ScoreNowButton`, `BrandAlertBanner` (yellow warning for unreviewed brand mentions)
  - Shared: `ScoreBar` (NaN-safe with N/A fallback), `PostPreview` (HTML-stripped summary with Read More expansion + URL + copy button), `ReclassifyButton` (with inline confirm), `ReclassifyToast` (10s countdown undo banner), `ExportCsvButton` (client-side CSV generation)
  - Activity: `ResearchActivityLog`, `SubredditSuggestionsList` (with relevance_score, post_frequency, discovered_via)
- **Reclassify system**: Move ideas between Tool↔Content tracks with confirmation dialog, undo within 10 seconds
- **Feedback logging**: All approve/reject/reclassify actions logged to `reddit_feedback_log` table
- **Post preview**: Shows HTML-stripped summary/selftext with Read More/Show Less expansion + Reddit URL with clipboard copy button
- **10 Reddit types** in `src/types/index.ts`: RedditFeedSource, RedditPost, RedditToolScore, RedditContentScore, RedditToolAction (`performed_by`, `created_at`), RedditContentAction (`performed_by`, `created_at`), RedditSubredditSuggestion, RedditAgentConfig, RedditFeedbackLog, RedditScoreRequest
- **Migration SQL files** for version control: `008_reddit_research.sql` (7 tables + RLS + indexes), `008b_seed_reddit_feeds.sql` (30 seed feeds)
- **PostgREST joins** using FK hints: `reddit_posts!post_id(*)` for score→post joins

### Cleanup / Nice-to-Have
- Audit runs 6-9 in Supabase have partial/duplicate data from debugging — delete from dashboard
- Gmail App Password on droplet is only 10 chars (needs 16) — but email is no longer needed
- Legacy `Downloads/Adwords auditor/` path in repo should be restructured
- Negative keywords are **campaign-level only** (no account-level shared lists in the current schema)
- **Housekeeping pending (accumulated across multi-session work)**:
  - Delete `master` branch local + remote (post-merge, master is no longer canonical)
  - Remove stray nested file `marketing-hq/Downloads/Adwords auditor/error_logger.py` (accidental commit from master's history)
  - Delete `/Users/niladri/package-lock.json` and `/Users/niladri/src/` mirror tree (stale dual-write artifacts)
  - Investigate 2 npm audit vulns (1 moderate, 1 high) — still pending; check again next dep refresh
  - Review `lucide-react@^1.7.0` pin — unusually old version; codebase uses inline SVGs throughout, may not actually import lucide-react anywhere
  - **`src/components/features/agents/` is vestigial naming** — the route moved from `/agents/brief-prompts` to `/conversations/brief-prompts` during the Phase 3b.5 sidebar restructure, but the component folder kept the old name. Phase 3c added more files to this folder. Future cleanup: rename to `src/components/features/prompt-editors/`.
  - **Stale "29 tables / 12 migrations" totals in older parts of this doc** — the Database Tables section header is now durable ("latest migration: 020_content_drafts") but older Current State / Completed sections still reference the stale totals. Not worth a full enumeration sweep; the per-section pointer is durable enough.
  - macOS pending kernel update on droplet (host-level, unrelated to app code)

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

### 2026-03-13 (continued) — Droplet Deployment Session
1. Deployed all 5 Python scripts to droplet via python3 heredoc + base64 methods
2. Fixed `push_to_supabase.py`: int()/float() casting for Supabase integer columns
3. Fixed `push_to_supabase.py`: all search_term objects now have matching keys (Supabase PGRST102 fix)
4. Fixed `report_json.py`: removed [:50]/[:30] caps on both droplet copies
5. Fixed `fetch_campaign_metrics.py`: module import path (`google_ads_auditor.google_ads_client`) + env var overrides
6. Both cron jobs now source `.env` before running
7. Full audit re-run: 402 negatives + 409 search terms pushed (audit_run_id=10)
8. Campaign metrics backfilled: 44 records across 30 days
9. Created `MARKETING_HQ_USER_GUIDE.docx` — professional user guide with API key generation + Clawbot setup instructions
10. Created `MARKETING_HQ_ROADMAP.docx` — 12-page roadmap with 3 phases (Analytics Foundation, Content & Lead Funnel, Automation & Workflows), contributor best practices, new feature checklist, data source pattern, database migration guide, droplet deployment guide, and AI assistant instructions

### 2026-03-16 — Reddit Research Page Session
1. Built `/research` page with 4 tabs (Tool Ideas, Content Ideas, Feed, Agents)
2. Created `useRedditResearch.ts` hook with 7 sub-hooks (~480 lines)
3. Created 19 components in `src/components/features/research/` (all under 150 lines)
4. Added "Reddit" to sidebar navigation
5. Fixed feed_sources display: column name `type`→`feed_type`, value `'keyword'`→`'keyword_search'`, id `number`→`uuid string`
6. Fixed Tool/Content Ideas empty tabs: rebuilt all Reddit type interfaces from actual Supabase schemas discovered by reading Python agent scripts — `score`→`upvotes`, `total_score`→`composite_score`, `tool_score_id`→`post_id`, `pain_level`→`intent_score`, `cluster`→`content_cluster`, `icp_match` boolean not number
7. Added reclassify buttons (Tool↔Content) with inline confirmation and 10-second undo toast
8. Added feedback logging to `reddit_feedback_log` for all approve/reject/reclassify actions
9. Added Agents tab: view/edit system prompts with version increment, enable/disable toggle
10. Added post content preview with summary truncation + URL display with clipboard copy button
11. Created migration SQL files (008, 008b) for version control
12. Updated PROJECT_CONTEXT.md with all Reddit Research work

### 2026-03-17 — Reddit Research Enhancements + Bug Fixes Session
**New Features:**
1. "Score Now" button: inserts into `reddit_score_requests`, polls until done, shows "Scoring..." state
2. "Generate Specs Now" / "Generate Briefs Now" buttons: `useSpecRequest(type)` hook inserts into `reddit_spec_requests` (tool_spec or content_brief), polls every 5s until completed, 5min auto-timeout. `GenerateButton.tsx` component placed next to CSV export on both Tool Ideas and Content Ideas tabs
3. Tool Spec Viewer: error-boundary-wrapped modal with solid #1A1A1A background, white 20px bold title, purple-400 section headers (16px semibold uppercase), gray-100 body text (14px, line-height 1.7), 32px padding, 800px max-width. Smart rendering: features as cards (name bold + description + priority badge), file_structure as monospace paths with descriptions, code sections in pre blocks. Markdown download (.md) with headers, bullets, code blocks
4. Content Brief Viewer: same solid modal treatment with blue-300 section headers. Collapsible channel sections with format/word_count metadata. Smart rendering for all nested objects. Markdown download
5. Feedback Summary per agent: approval/rejection counts, rate bar (color-coded), last 5 entries on each AgentCard
6. Subreddit Suggestions fix: now shows relevance_score, post_frequency, discovered_via; auto-adds to reddit_feed_sources on approve; sets reviewed_by/reviewed_at
7. Brand Alert Banner: yellow warning when unreviewed brand_mention posts exist, expandable list with links
8. CSV Export: client-side export on Tool Ideas and Content Ideas tabs (12/14 columns respectively)
9. Prompt Suggestions: pattern analysis on feedback data — rejection rates, per-subreddit performance, score differentiation, reclassification patterns
10. Sidebar notification badge: red count badge on "Reddit" nav item for unreviewed brand mentions
11. Read More/Show Less expansion on PostPreview: truncates at 200 chars, expand to full text with toggle button
12. Text styling: titles bumped to 16px/font-semibold (#E5E7EB), rationale text 13px/italic in purple (#C4B5FD), body text 14px (#D1D5DB) with whitespace-pre-line

**Bug Fixes:**
13. `acted_by` → `performed_by`, `acted_at` → `created_at`: column names in useRedditResearch.ts and types/index.ts didn't match actual Supabase schema
14. Reclassify buttons invisible: were black text on dark background. Fixed with #9CA3AF text + #4B5563 border, hover transitions to white + purple
15. Approve/Reject silently failing: added try/catch with console.error + alert() to surface actual Supabase errors
16. Hover/click effects on all buttons: global `.btn-research` CSS class (brightness(1.2) + scale(1.02) on hover, scale(0.98) on active)
17. View Spec button not showing: Approved filter only matched `action === 'approved'`, so `review_ready` items were invisible. Changed to exclusion logic: Approved tab now shows everything except `rejected`/`archived`
18. View Spec crash: JSON.parse could return null/primitives crashing render. Added React error boundary wrapping entire viewer + raw text fallback for non-JSON notes
19. `[object Object]` in features/file_structure: features array contained objects with feature/description/priority fields; file_structure was a key-value object. All now have dedicated smart renderers
20. ScoreBar NaN: scores stored as strings or null caused NaN display. Added null/undefined/NaN guard with Number() coercion, shows "N/A" for missing scores
21. Raw HTML in post preview: Reddit selftext contained `<!-- SC_OFF --><div class="md">` HTML tags. Added regex strip + HTML entity decoding (&amp; &lt; &gt; &quot; &#039;)
22. `isActed` too narrow: only checked 3 statuses, now uses `!!status` to catch all action states (in_progress, deployed, published, etc.)

**Infrastructure:**
23. Added `reddit_spec_requests` table (now 11 reddit tables, 24 total)
24. Droplet cron: 9 Reddit jobs (added poll_spec_requests */5)
25. tool_builder and brief_builder agents upgraded to Sonnet on droplet
26. Updated PROJECT_CONTEXT.md with all session work

### 2026-03-19 — Push-to-Ads Fix + Keywords UX Session
**UX Improvements:**
1. Grouped negative keywords by term: same keyword across multiple campaigns now shows as single row with purple campaign count badge, aggregated metrics, expand/collapse for per-campaign details
2. New `GroupedKeywordRow.tsx` component with one-click approve/deny for all campaign instances
3. Added category filter dropdown to Keywords page (e.g., filter by `diy_learners`), highlights purple when active, shows count per category
4. Category label shown on each grouped row in yellow text

**Push-to-Ads Fixes (droplet only — `push_negatives_to_ads.py`):**
5. Fixed import: `google_ads_client` → `google_ads_auditor.google_ads_client` (same bug as fetch_campaign_metrics.py)
6. Added env var overrides for Google Ads credentials (config.yaml has empty values, .env has the real tokens)
7. Removed `metadata` column write — column doesn't exist on `negative_keywords` table, was causing PGRST204 errors
8. Successfully pushed 735 negative keywords to Google Ads campaigns
9. Bulk-updated all 735 from `approved` → `pushed` status in Supabase (status wasn't updating due to metadata bug)

### 2026-03-21 — AI Visibility Tracker Session
**Database (migration 010):**
1. `ai_visibility_keywords` — 15 seed keywords across 5 categories (listing management, reputation, local SEO, social/pages, competitive)
2. `ai_visibility_runs` — run metadata with status, models_queried, estimated_cost, trigger_source, schedule_frequency
3. `ai_visibility_results` — per keyword × model × repetition results with synup_mentioned, synup_position, competitors_data JSONB, all_urls_found
4. `ai_visibility_competitors` — 12 competitors with name + variations text[] for case-insensitive matching (created directly in Supabase)

**Python fetcher (droplet):**
5. `fetch_ai_visibility.py` — queries GPT-4o + Claude Sonnet for each keyword (3 reps each), parses responses for Synup + 12 competitor mentions/positions/URLs, writes results in batches of 25
6. `run_ai_visibility.sh` — cron wrapper, daily 6am check, reads schedule_frequency from last run (default 2x-week), logs to /var/log/ai_visibility.log
7. Competitors pulled dynamically from `ai_visibility_competitors` table (not hardcoded), domain inferred from variations array

**API route:**
8. `/api/ai-visibility/run` — GET returns latest run status, POST creates pending run record (TODO: wire up droplet trigger)

**React hook:**
9. `useAIVisibility.ts` — Synup summaries per model (majority-vote mentioned, avg position, delta from previous run, deduplicated URLs), competitor summaries per model (mention rate %, avg position, delta, top URLs), keyword/competitor CRUD, run history, triggerRun

**Dashboard page + components:**
10. `/ai-visibility` page with 4 tabs: OpenAI Results, Claude Results, Keywords, Competitors
11. 9 components in `src/components/features/ai-visibility/`: RunControls, SynupResultsTable, SynupRow, CompetitorResultsTable, KeywordManager, KeywordRow, CompetitorManager, CompetitorRow (all under 150 lines)
12. Sidebar updated with "AI Visibility" nav item (◉ icon)
13. 7 new TypeScript types: AIVisibilityKeyword, AIVisibilityRun, AIVisibilityResult, CompetitorMention, AIVisibilityCompetitor, SynupKeywordSummary, CompetitorSummary

**First production run:**
14. Run ID: 998817ec-7c1c-4541-a3bd-52ca5578af8c — 15 keywords × 2 models × 3 reps = 90 queries completed

### 2026-03-23 — AI Visibility Day 5 Polish Session
**Run Now via Supabase polling:**
1. `run_ai_visibility.sh` now supports `--check-pending` mode — queries for `status='pending'` runs and executes them via `fetch_ai_visibility.py --run-id <UUID>`
2. `fetch_ai_visibility.py` accepts `--run-id` argument to pick up existing pending runs (marks them as `running`, proceeds normally). Uses `argparse` for CLI args
3. New cron entry: `*/2 * * * * run_ai_visibility.sh --check-pending` — "Run Now" button creates pending record, droplet picks it up within 2 minutes

**Frequency config persistence:**
4. Migration 011: `ai_visibility_config` table (key/value/updated_at) with `schedule_frequency='2x-week'` seed
5. `RunControls` frequency dropdown now reads from and writes to config table via `useAIVisibility` hook (`fetchFrequency`, `updateFrequency`)
6. Shell script reads frequency from config table instead of last run record

**Expandable rows with position history:**
7. `SynupRow` is now clickable — expands to show `SynupRowHistory` mini table (Run Date | Position | Change)
8. `fetchPositionHistory(keywordId, model)` in hook queries last 10 completed runs, computes per-run avg position + delta
9. History loaded lazily on first expand, cached for subsequent toggles

**Loading states and error handling:**
10. `LoadingSkeleton.tsx` — `TableSkeleton` (animated pulse rows), `EmptyState` ("No data yet — trigger your first run"), `ErrorBanner` (red with Retry button)
11. All Supabase fetches in hook now throw descriptive errors on failure; results fetch wrapped in `.catch()`
12. Page shows skeletons during loading, contextual empty states when no runs or no results for a model

**CSV export:**
13. `ExportCSVButton.tsx` — shared component with proper CSV escaping (commas, quotes, newlines), triggers browser download with date-stamped filename
14. Added to both `SynupResultsTable` and `CompetitorResultsTable` header bars

**Security audit:**
15. Confirmed no hardcoded secrets in any tracked files — all credentials via env vars
16. `.gitignore` properly excludes `.env`, `.env.local`, `.env.*.local`

### 2026-05-17 — Phase 3a Ship + Branch Consolidation

**Phase 3a — Conversations review queue shipped:**
1. Built `/conversations` page with light-theme review surface (sidebar stays dark navy)
2. 5 API routes (GET list + counts, PATCH approve/reject/revoke) gated by new `requireAdmin` helper at `src/lib/auth/`
3. 9 hooks: `useUrlState`, `useConversations`, `useApprove`, `useReject`, `useRevoke`, `useDetailDrawer`, `useKeyboardNav`, `useConversationActions`, `useToast`
4. 17 components under `src/components/features/conversations/`: `InsightCard`, `DetailDrawer` (split into `DrawerHeader` + `DrawerVerbatim` + `DrawerScores` + `DrawerMetadata` + `DrawerActions`), `ConversationsTabBar`, `ConversationsFilters`, `ConversationsView`, `ConversationsContainer`, `ApprovalPicker`, `RejectInput`, `JustApprovedBanner`, `KeyboardFooter`, `ShortcutHelpModal`
5. 4 UI primitives added: `Button`, `Chip`, `ScoreBadge`, `Toast` (with `ToastProvider` mounted in dashboard layout)
6. Optimistic approve/reject/revoke flow with animated card exit (250ms slide + fade), source/dest count bumps, error toast on mutation failure (mutation hooks own the error toast — page handlers only revert state)
7. Detail drawer slides from right (480px, 300ms transform), 300ms render-row lag keeps content alive during exit animation so panel doesn't blank out mid-slide
8. Keyboard nav: j/k navigate, Enter open drawer, A/R open approve/reject inline pickers on focused card, Esc close/cancel, ? help modal. Bails on `input`, `textarea`, `select`, `[contentEditable]`, `[role=textbox]`
9. URL state for tab + filters (`?tab=pending&conversation_type=sales&bracket=high`); ConversationsPage wrapped in Suspense for Next 15 useSearchParams requirement
10. JustApprovedBanner shows in Approved tab for 30s after approval with Undo button (revokes); auto-clears on tab switch
11. Sidebar `NAV_ITEMS` widened from `string` to `ReactNode` for icons; `Conversations` entry uses inline MessageSquare SVG (lucide path data, no icon library installed)
12. Disabled placeholder buttons in Approved tab (`View brief` / `Download brief`) with "Coming in Phase 3b" tooltip
13. Built into production cleanly: /conversations route at 8.36 kB / 111 kB First Load JS

**Branch consolidation:**
14. main and master had diverged since late March (main = signature manager + leads + ai-visibility + email-signatures + error-logs, master = Phase 1/2/3a content intelligence). Merged master into main on 2026-05-17 via direct merge
15. 7 conflicts resolved: `.env.example` (union env vars — kept Email Signatures DWD creds), `package.json` (union deps — added TipTap suite, clsx, date-fns, lucide-react), `package-lock.json` (deleted + `npm install` regenerated), `src/app/globals.css` (kept main's `.btn-research` hover rules), `src/components/layout/Sidebar.tsx` (kept both imports, unioned NAV_ITEMS with Conversations inserted between Reddit and AI Visibility, kept main's "Reddit" label rename at `/research`), `src/hooks/usePseoContent.ts` (add/add — see note below), `src/types/index.ts` (kept main's RedditScoreRequest + Error Logs + JobHeartbeat + TallyLead + LeadsFilters + AI Visibility type additions)
16. Dual-write convention dropped — `/Users/niladri/src/` was a stale 24 Mar mirror that hadn't been updated since Phase 1. Single source of truth now: `Downloads/Adwords auditor/marketing-hq/src/`
17. Merge committed (a263dd6), pushed to origin/main, Vercel auto-deployed

**usePseoContent.ts merge decision (watch for regression):**
18. The hook's `computeAnalytics` had an add/add conflict on a single line — the indexed-status check. Kept master's `a.indexerResponseCode === 200 || a.indexerStatus?.toLowerCase() === 'success'` over main's `a.indexerStatus?.toLowerCase() === 'indexed'`. `indexerResponseCode` is from the indexer service, not the page itself. If the pSEO indexed-count metric shifts unexpectedly post-merge, union both checks (add `|| indexerStatus === 'indexed'`).

**Verification:**
19. `npx tsc --noEmit` clean. `npm run build` clean — 32 pages generated, /conversations at 8.36 kB, all conversations API routes present alongside existing main routes (`/leads`, `/ai-visibility`, `/email-signatures/*`, `/errors`, `/research`). 1 build warning about `@next/swc` lockfile patch — non-fatal.

### 2026-05-19 — Phase 3b Brief Generator Ship

End-to-end brief generation pipeline shipped. See **Phase 3 Status → Phase 3b — SHIPPED** above for the full architecture. Deliverables checklist:

1. Migration 018 `content_briefs` table (id, call_insight_id FK, asset_type CHECK, status CHECK, brief_content, prompt_used, model_version, generation_metadata JSONB, error_message, retry_count, ready_at, timestamps + updated_at trigger). Run in Supabase.
2. `supabase/brief_prompts/` — `base.md` + 5 asset-type prompts (blog_post, deep_article, use_case, collateral, tool). Iterated once during ship (tighter outline guidance, added Brief length spec, consolidated Voice + Editorial sections, added explicit "voice is always Niladri's" rule across long-form and short-form prompts).
3. `supabase/process_content_briefs.py` worker (stdlib urllib, claim-via-conditional-PATCH, inline retry 3x with 0/30/60s backoffs, MAX_PER_RUN=10) + `supabase/run_content_briefs.sh` wrapper.
4. SCP'd worker + wrapper + brief_prompts/ to `/opt/google-ads-auditor/` on droplet. Smoke tested via `--max-briefs 1 --dry-run` (boots clean, fetched 0 candidates as expected pre-ship). Added cron `*/2 * * * * /opt/google-ads-auditor/run_content_briefs.sh`.
5. Approve API (`src/app/api/conversations/[id]/approve/route.ts`) — best-effort INSERT into `content_briefs` for long-form asset types with idempotency check on `(call_insight_id, asset_type) IN ('pending','generating')`. Failures logged + swallowed; never breaks the approve response. Revoke route (`/revoke/route.ts`) gets a code comment noting that pending briefs are NOT cancelled on revoke (accepted v1 inefficiency).
6. Status endpoint `GET /api/conversations/[id]/brief` — returns most-recent brief metadata via `.maybeSingle()`. Response: `{ brief: {...} | null }`. `chars` and `output_tokens` derived (not columns). `brief_content` NEVER returned by this endpoint.
7. Download endpoint `GET /api/conversations/[id]/brief/download` — serves most-recent `status='ready'` brief as `text/markdown` attachment with filename `brief-{asset_type}-{YYYYMMDD}.md` and `Cache-Control: no-store`. 404 if no ready brief, 500 if ready row has null content (defensive).
8. `useConversationBrief(callInsightId, { enabled })` hook — 5s polling while pending/generating, AbortController + setTimeout cleanup, `enabled: false` short-circuits.
9. `<ConversationBriefStatus />` component — 4 states (amber Queued pill, amber Generating pill with pulsing dot, cyan Download button with programmatic anchor click against /download endpoint, rose Failed pill with error_message in title attr).
10. Integration in `InsightCard.tsx` (gated by new `isApprovedTab` prop piped from `ConversationsView` via `p.url.tab === 'approved'`) and `DrawerActions.tsx` (gated by `row.review_status === 'approved'`). Disabled "View brief" placeholder retained in both (Phase 3b.5).
11. Filter persistence fix bundled: `useUrlState.setTab` now navigates to `?tab=X` directly (drops all other params on tab switch). Fixes Phase 3a "where's my row" UX wart.
12. Chevron affordance bundled: 20×20 inline slate-400 SVG on `InsightCard` bottom row, brightens to slate-600 on card group-hover. Outside the actions-row `stopPropagation` boundary so chevron clicks bubble to open the drawer.
13. Builds clean (`npx tsc --noEmit` + `npm run build`). /conversations route went from 8.36 kB → 9.20 kB across the phase's UI additions. All deploys via push-to-main → Vercel auto-deploy.

**One known scope deferral:** the `DrawerActions` test plan called for "View brief disabled on pending drawer". The pre-existing DrawerActions only renders the brief buttons inside the approved branch (pending shows Reject + Approve only), so View brief disabled does NOT appear on pending drawers — this is pre-existing behavior, untouched.

### 2026-05-20 — Phase 3b.5 Ship (Prompt Editor + In-App Brief Viewer)

End-to-end editor surface for brief prompts + an in-app reader for the briefs themselves. See **Phase 3 Status → Phase 3b.5 — SHIPPED** above for the full architecture. Deliverables checklist:

1. Migration 019 `content_brief_prompts` table + generic `set_updated_at()` PL/pgSQL function (CREATE OR REPLACE so future migrations can reuse). Seeded with the 6 brief prompt files, byte-fidelity verified pre-commit.
2. `process_content_briefs.py` patched to read from DB via new `get_prompt(name)` helper + module-level `_prompt_cache`. Disk files in `supabase/brief_prompts/` retained as seed-source reference only; no longer read at runtime. New `PromptNotFoundError` (terminal) vs `FetchError` (transient inline retry) error classification.
3. GET /api/brief-prompts (list with content) + PATCH /api/brief-prompts/[name] (validate name + content, set updated_by from session email or body override).
4. UI editor at `/conversations/brief-prompts`: master-detail (~30%/~70%), `useBriefPrompts` hook with per-prompt `pendingChanges` dict (switching prompts preserves edits), amber dot in list for dirty rows, cyan Save / slate-200 disabled, emerald "Saved {time}" 3s pip. Page is a server component with `requireAdmin` via try/catch — non-admin sees a friendly "Admin only" card.
5. Sidebar restructure: Conversations parent becomes a collapsible group, chevron toggle with `stopPropagation`, children render with `pl-10` indent (corrected from spec's `pl-8` — parent text-start is at ≈36px so `pl-8` would have under-indented). Default expanded, no localStorage. Route moved from `/agents/brief-prompts` → `/conversations/brief-prompts`. Child active state uses dark-theme tokens (`var(--brand)` border, `var(--surface-2)` bg, `var(--text)` label) — light cyan-500/slate-100 from spec would clash on the dark sidebar; spec's wording was right for the destination page palette, wrong for the sidebar chrome.
6. In-app brief viewer: `BriefViewerModal` (light-theme, `max-w-3xl`) renders markdown via `react-markdown` (new dep, ~30 kB). Hand-styled `components` map (no `@tailwindcss/typography` plugin). Three close paths (X / Esc / overlay), `stopPropagation` on modal body. Status endpoint extended with `?content=true` — default polling shape unchanged. View brief button on `DrawerActions` now active when ready + has_content; tooltip swap when not ready.
7. Builds clean throughout. `/conversations` bundle 9.20 → 43.9 kB (react-markdown weight). `/conversations/brief-prompts` at 2.86 kB.

### 2026-05-21 — Phase 3c Ship (Draft Generator + Editor)

`thought_leadership` draft pipeline shipped end-to-end. Parallel architecture to the brief pipeline, adapted for short-form publish-ready social posts (150-280 words target). See **Phase 3 Status → Phase 3c — SHIPPED** above for the full architecture. Deliverables checklist:

1. Migration 020 `content_drafts` + `content_draft_prompts` tables. Reuses `set_updated_at()` from migration 019. Seeded with 4 prompt files (base + 3 author voices), byte-fidelity verified pre-commit.
2. `supabase/process_content_drafts.py` adapted from briefs worker via str.replace + 5 targeted manual edits (`build_user_message` rewrite, dropped unused `approved_asset_type`/`suggested_asset_type` from select clause, `build_system_prompt` local var rename, asset-type validation moved to top of `process_one_draft`, module docstring updates). `MAX_TOKENS=2048`. Same retry semantics, same MAX_PER_RUN=10.
3. `supabase/run_content_drafts.sh` wrapper, cron `*/2 * * * *`. SCP'd to droplet alongside the briefs worker.
4. Approve API gains parallel draft branch: `assetType === 'thought_leadership'` → INSERT into `content_drafts` with `author_voice='niladri'` (hardcoded v1; `DRAFT_DEFAULT_VOICE` constant + comment noting `call_insights.suggested_author` as the upgrade path). Idempotency check includes `'ready'` status (unlike briefs which only check pending/generating).
5. GET /api/conversations/[id]/draft + PATCH (5,000-char cap, no `updated_by`). PATCH does SELECT-then-UPDATE because PostgREST can't ORDER+LIMIT a PATCH.
6. `useConversationDraft` hook (5s poll, AbortController cleanup, refetch). `useDraftEditor` hook (pending/saved state, save, discard) extracted so `DraftEditorModal` stays under cap. `ConversationDraftStatus` (parallel to brief status) owns its `DraftEditorModal` internally — drop-in component.
7. Dispatcher logic in `InsightCard` + `DrawerActions`: branch on `row.approved_asset_type === 'thought_leadership'` → draft components, else briefs flow unchanged. `DrawerActions` also gates `useConversationBrief` to skip polling on thought_leadership rows.
8. Draft prompts editor at `/conversations/draft-prompts`: parallel to brief prompts editor. `useDraftPrompts` + `DraftPromptsEditor` + list/editor subcomponents. Generated via Python str.replace + 5 manual patches (`VALID_PROMPT_NAMES` set, LABELS dicts in two files, page description "drafts are short-form" not "long-form", phase + migration refs).
9. Sidebar Conversations group now has 2 children: Brief prompts + Draft prompts. Chevron + indent infrastructure from Phase 3b.5 handles both with zero changes.
10. Builds clean. Worker matches brief worker's structural size (~720 lines) within the soft cap precedent.

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
10. **Read the roadmap** — new contributors and AI assistants should read `MARKETING_HQ_ROADMAP.docx` before building new features
11. **Feature branches only** — never commit directly to main; create `feature/your-feature-name` and merge via PR
12. **Follow the 4-layer pattern** — new data sources = new table + new fetcher + new hook + new page (see roadmap Section 2.4)
