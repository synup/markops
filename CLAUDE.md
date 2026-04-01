# Marketing HQ — Claude Code Rules

## Repo
- GitHub: https://github.com/synup/markops
- Local: `/Users/niladri/Downloads/Adwords auditor/marketing-hq/`
- Deploy: marketing-hq-nine.vercel.app (Vercel, auto-deploy from main)
- **CRITICAL**: Vercel builds from repo root `src/`, not from `Downloads/Adwords auditor/marketing-hq/src/`
  Changes must be applied to BOTH paths if editing locally.

## Docs & Issues
- Issues dir: `/Users/niladri/Downloads/Claude Issues/`
- Docs dir: `/Users/niladri/Downloads/Claude Docs/`
- **On every task**: create `YYYY-MM-DD-<3words>.md` in Issues using `date` command for today's date
- **On every project**: maintain a named, dated spec doc in Claude Docs

## Working rules

### Agents
1. Use subagents for exploration and multi-file analysis
2. Delegate research tasks — return only summarised insights, not raw dumps
3. Never paste full file contents when a summary suffices

### Components
4. **150-line hard cap** — if a component exceeds 150 lines, split it automatically
5. **Always separate UI from logic** — UI lives in `src/components/`, logic in `src/hooks/`
6. No business logic inside page files — pages compose components only

### Deploy
7. Check everything on local dev (`npm run dev`) before deploying
8. Do a fresh `git pull` from GitHub before every deploy
9. Run `npm run build` locally and confirm zero errors before pushing

## Stack
- Next.js 15, React 19, TypeScript strict
- Tailwind CSS v4 (imported via `@import 'tailwindcss'` — no tailwind.config.ts)
- Supabase (project: bgxgukkriymmtlzkkjkg) — same project for ALL features
- `googleapis` v171 already installed — use for Google APIs
- DigitalOcean droplet at 167.71.229.75 runs all Python fetchers (cron jobs)

## Design system (dark theme — use CSS vars, not Tailwind colour classes)
```
--bg: #0C0C0C          backgrounds (page)
--surface: #141414     card/header backgrounds
--surface-2: #1A1A1A   hover states, secondary surfaces
--surface-3: #202020   tertiary surfaces
--border: #262626      standard borders
--border-subtle: #1C1C1C  sidebar/subtle dividers
--text: #FFFFFF        primary text
--text-muted: #888888  secondary text
--text-dim: #444444    placeholder/disabled text
--brand: #7C3AED       purple — primary CTA, active states
--brand-muted: rgba(124,58,237,0.15)
--brand-border: rgba(124,58,237,0.35)
--green: #22C55E       success
--green-muted: rgba(34,197,94,0.12)
--red: #EF4444         error/danger
--red-muted: rgba(239,68,68,0.12)
--yellow: #F59E0B      warning
--blue: #3B82F6        info
```
**Never use**: `bg-white`, `bg-gray-*`, `text-gray-*`, `border-gray-*`, `bg-brand-blue` —
these are from the standalone email-signatures app and clash with the dark theme.

## Auth
- Google OAuth domain-locked to @synup.com — handled in `middleware.ts`
- Do NOT add separate auth guards to dashboard pages — middleware covers everything
- User profiles in `public.profiles` table — role: `admin | editor | viewer`

## Secret: GOOGLE_SERVICE_ACCOUNT_JSON
- Already in `.env.local` and `.env.example`
- Used for Google Sheets (pSEO) AND Gmail/Admin SDK (email signatures)
- **Never in source code. Never in database.**
- Add `GOOGLE_ADMIN_EMAIL=niladri@synup.com` for email signature DWD calls

## Supabase migration numbering
Existing migrations go up to `011`. Next migration must start at `012`.
Migration files: `supabase/migrations/NNN_descriptive_name.sql`

## Current nav routes (Sidebar.tsx)
```
/               Dashboard
/audit          Adwords Audit
/campaigns      Google Ads Campaigns   ← TAKEN — email sig campaigns go under /email-signatures/campaigns
/keywords       Keywords
/leads          Leads
/research       Reddit Research
/ai-visibility  AI Visibility
/pseo-content   pSEO Content
/errors         Error Logs
/settings       Settings
```

---

## Active project: Email Signatures integration

### Context docs
- Full spec + architecture: `/Users/niladri/Downloads/Claude Docs/email-signature-manager-2026-03-30.md`
- Issue log: `/Users/niladri/Downloads/Claude Issues/2026-03-30-email-signature-manager.md`
- Source files (standalone build): `/Users/niladri/Downloads/email-signatures/`
  (Extract from tarball first: `cd ~/Downloads && tar -xzf email-signatures.tar.gz`)

### Integration plan (6 changes)
1. **Routes** — all under `/email-signatures/` prefix to avoid collision with `/campaigns`
2. **Sidebar** — add one entry: `{ label: 'Email Signatures', href: '/email-signatures', icon: '✉' }`
3. **Reskin** — swap all light Tailwind classes for dark CSS vars (see design system above)
4. **Auth** — remove standalone auth; use existing middleware + profiles.role
5. **Migrations** — 5 new tables numbered 012–016, rename `users` → `workspace_users`
6. **Dependencies** — `npm install react-email-editor date-fns clsx lucide-react`

### New routes to create
```
src/app/(dashboard)/email-signatures/
  layout.tsx                    Topbar wrapper ("Email Signatures")
  page.tsx                      Signature Management (list + Deploy All)
  company-data/page.tsx         Workspace user table
  [id]/edit/page.tsx            Unlayer editor
  campaigns/page.tsx            Time-bound banner campaigns
  analytics/page.tsx            Deploy history
  settings/page.tsx             General settings + integrations
  setup/page.tsx                First-time wizard
```

### New API routes to create
```
src/app/api/
  google/sync-users/route.ts    Pull users from Workspace Directory
  google/test-connection/route.ts  Verify DWD
  signatures/deploy/route.ts    Deploy all to Gmail
  email-campaigns/route.ts      Campaign CRUD (NOT /api/campaigns — that's taken)
```

### New lib files to copy from standalone (then adapt)
```
src/lib/google/auth.ts           service account JWT helper
src/lib/google/syncUsers.ts      Admin SDK → workspace_users table
src/lib/google/deploySignature.ts  full deploy pipeline
src/lib/signatures/resolveTokens.ts
src/lib/signatures/buildSignatureHtml.ts
```

### Components to copy + reskin
Copy from `/Users/niladri/Downloads/email-signatures/src/components/` into
`src/components/email-signatures/` then reskin each one to dark CSS vars.

### Migrations (numbered 012–017)
```
012_email_sig_workspace_users.sql
013_email_sig_signatures.sql
014_email_sig_assignments.sql
015_email_sig_campaigns.sql
016_email_sig_deploy_logs.sql
017_email_sig_settings.sql        ← key/value settings (auto_import_enabled)
```
Note: standalone had an `admin_users` table — DO NOT port it. Use `profiles.role` instead.

### Cron: Workspace User Sync
- Script: `google_ads_auditor/run_workspace_sync.sh`
- Fetcher: `google_ads_auditor/fetch_workspace_users.py`
- Schedule: `0 2 * * *` (2am daily)
- Droplet: 167.71.229.75 at `/opt/google-ads-auditor/`
- Logs: `/opt/google-ads-auditor/logs/workspace_sync_YYYY-MM-DD.log`
- Checks `es_settings.auto_import_enabled` flag before running — exits early if `false`
- Upserts all Google Workspace users into `es_workspace_users`; sets `is_active=false` for suspended users

### Start sequence for Claude Code
```
1. git pull
2. npm install react-email-editor date-fns clsx lucide-react
3. Read this file + spec doc + source files
4. Write migrations 012–016
5. Create route group scaffold (empty pages first)
6. Copy + adapt lib files
7. Copy + reskin components (dark vars, 150-line cap)
8. Add Sidebar entry last (after everything builds clean)
9. npm run build → confirm zero errors
10. npm run dev → visual check
11. Commit + push
```
