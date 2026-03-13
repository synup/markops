# Clawbot API Documentation

> REST API for the CEO daily data bot. Uses Supabase REST API with `service_role` key for full access.

## Base URL

```
https://bgxgukkriymmtlzkkjkg.supabase.co/rest/v1
```

## Authentication

All requests require these headers:

```
apikey: <SUPABASE_SERVICE_ROLE_KEY>
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
```

## Endpoints

### 1. Latest Audit Score

Get the most recent audit run with overall health score.

```
GET /audit_runs?order=created_at.desc&limit=1
```

**Response fields**: `id`, `run_date`, `score` (0-100), `grade` (A-F), `total_checks`, `passed_checks`, `failed_checks`, `categories` (array), `critical_issues` (array), `quick_wins` (array), `account_summary` (object)

**Example**: "What's our current audit score?"
→ `score: 62.5, grade: C, passed: 45/74 checks`

### 2. Negative Keyword Candidates

Get pending negative keywords that need review.

```
GET /negative_keywords?status=eq.candidate&order=cost.desc
```

**Response fields**: `id`, `term`, `campaign`, `match_type`, `category`, `impressions`, `clicks`, `cost`, `conversions`, `status`

**Example**: "How many negative keywords need review?"
→ Count of `candidate` status rows

### 3. Approved Keywords Waiting to Push

```
GET /negative_keywords?status=eq.approved&select=id,term,campaign,cost
```

### 4. Wasted Spend Summary

Get search term summary for the latest audit.

```
GET /search_term_summaries?order=created_at.desc&limit=1
```

**Response fields**: `total_terms`, `total_cost`, `total_conversions`, `wasted_spend`, `negative_candidates_count`, `expansion_candidates_count`, `category_breakdown` (object)

**Example**: "How much are we wasting on bad search terms?"
→ `wasted_spend: $894`

### 5. Campaign Metrics (Daily Snapshots)

Get recent campaign performance data.

```
GET /campaign_metrics?order=snapshot_date.desc&limit=50
```

Filter by campaign:
```
GET /campaign_metrics?campaign_name=eq.Non-Brand&order=snapshot_date.desc&limit=30
```

**Response fields**: `snapshot_date`, `campaign_id`, `campaign_name`, `campaign_type`, `status`, `impressions`, `clicks`, `cost`, `conversions`, `conv_value`, `ctr`, `cpc`, `conv_rate`, `roas`

### 6. Top Wasted Search Terms

```
GET /search_terms?term_type=eq.wasted_spend&order=cost.desc&limit=20
```

Or negative candidates sorted by cost:
```
GET /search_terms?term_type=eq.negative_candidate&order=cost.desc&limit=20
```

### 7. Action History (Audit Trail)

```
GET /keyword_action_log?order=performed_at.desc&limit=50
```

**Response fields**: `action_type`, `term`, `campaign`, `previous_status`, `new_status`, `performed_by`, `performed_at`

### 8. Push History

```
GET /push_requests?order=created_at.desc&limit=10
```

**Response fields**: `status`, `keyword_count`, `pushed_count`, `failed_count`, `created_at`, `completed_at`

## Common Query Patterns

### Aggregate: Total wasted spend across all candidates
```
GET /negative_keywords?status=eq.candidate&select=cost
```
Sum the `cost` field client-side.

### Filter by date range
```
GET /campaign_metrics?snapshot_date=gte.2026-03-01&snapshot_date=lte.2026-03-13
```

### Count rows
Add header: `Prefer: count=exact` and `select=id` with `head=true`
```
GET /negative_keywords?status=eq.candidate&select=id
Header: Prefer: count=exact
```
The count is in the `Content-Range` response header.

## Notes

- All monetary values are in USD
- `cost` is in dollars (not micros)
- `ctr` is percentage (e.g., 3.5 = 3.5%)
- Dates are ISO 8601 format
- The `service_role` key bypasses Row Level Security — keep it private
