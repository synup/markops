#!/usr/bin/env python3
"""
Push audit results from the Google Ads auditor to Supabase.
Runs on the DigitalOcean droplet after each audit.

Usage:
  python push_to_supabase.py /path/to/google_ads_audit_YYYY-MM-DD.json

Requires env vars:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
"""

import json
import os
import sys
from datetime import datetime
from urllib.request import Request, urlopen
from urllib.error import HTTPError


SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')


def api_post(table: str, payload: dict | list) -> dict:
    """POST to Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    }
    data = json.dumps(payload).encode()
    req = Request(url, data=data, headers=headers, method='POST')
    try:
        with urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except HTTPError as e:
        body = e.read().decode() if e.fp else ''
        print(f"  ERROR {e.code}: {body}")
        raise


def push_audit(report_path: str) -> None:
    """Parse audit JSON and push to Supabase tables."""
    with open(report_path) as f:
        report = json.load(f)

    run_date = report.get('meta', {}).get('generated_at', datetime.now().isoformat())[:10]
    health = report.get('health_score', {})
    score = health.get('overall', health.get('score', 0))
    grade = health.get('grade', 'F')
    total = health.get('total_checks', 74)
    passed = health.get('passed', 0)
    failed = health.get('failed', 0)

    # --- 1. Insert audit run ---
    print(f"Pushing audit run: {run_date} — {score}/100 ({grade})")
    rows = api_post('audit_runs', {
        'run_date': run_date,
        'score': score,
        'grade': grade,
        'total_checks': total,
        'passed_checks': passed,
        'failed_checks': failed,
        'categories': report.get('categories', []),
        'critical_issues': report.get('critical_issues', []),
        'quick_wins': report.get('quick_wins', []),
        'account_summary': report.get('account', report.get('account_info', {})),
        'raw_report': report,
    })
    audit_run_id = rows[0]['id'] if isinstance(rows, list) and rows else None
    print(f"  audit_run_id = {audit_run_id}")

    if not audit_run_id:
        print("  Failed to get audit_run_id, skipping keyword tables")
        return

    # --- 2. Negative keywords ---
    search_terms = report.get('search_terms', {})
    neg_candidates = search_terms.get('negative_keyword_candidates', search_terms.get('negative_candidates', []))
    if neg_candidates:
        neg_rows = [{
            'audit_run_id': audit_run_id,
            'term': n.get('search_term', n.get('term', '')),
            'campaign': n.get('campaign', 'Unknown'),
            'ad_group': n.get('ad_group'),
            'match_type': n.get('recommended_match_type', 'exact'),
            'category': ', '.join(n.get('categories', [])) if isinstance(n.get('categories'), list) else n.get('category', ''),
            'impressions': n.get('impressions', 0),
            'clicks': n.get('clicks', 0),
            'cost': n.get('cost', 0),
            'conversions': n.get('conversions', 0),
            'status': 'candidate',
        } for n in neg_candidates]
        api_post('negative_keywords', neg_rows)
        print(f"  Pushed {len(neg_rows)} negative keyword candidates")

    # --- 3. Keyword expansions ---
    kw_candidates = search_terms.get('keyword_expansion_candidates', search_terms.get('keyword_candidates', []))
    if kw_candidates:
        kw_rows = [{
            'audit_run_id': audit_run_id,
            'term': k.get('search_term', k.get('term', '')),
            'campaign': k.get('campaign', 'Unknown'),
            'clicks': k.get('clicks', 0),
            'conversions': k.get('conversions', 0),
            'cpa': k.get('cpa', 0),
            'status': 'candidate',
        } for k in kw_candidates]
        api_post('keyword_expansions', kw_rows)
        print(f"  Pushed {len(kw_rows)} keyword expansion candidates")

    # --- 4. Keywords to pause ---
    pause_candidates = report.get('keywords_to_pause', [])
    if pause_candidates:
        pause_rows = [{
            'audit_run_id': audit_run_id,
            'keyword': p.get('keyword', ''),
            'campaign': p.get('campaign', 'Unknown'),
            'ad_group': p.get('ad_group'),
            'reason': p.get('reason', ''),
            'spend': p.get('spend', p.get('cost', 0)),
            'quality_score': p.get('quality_score'),
            'conversions': p.get('conversions', 0),
            'status': 'candidate',
        } for p in pause_candidates]
        api_post('keywords_to_pause', pause_rows)
        print(f"  Pushed {len(pause_rows)} keywords to pause")

    # --- 5. Search terms (all types) ---
    all_search_terms = []

    # Negative candidates
    for n in neg_candidates:
        all_search_terms.append({
            'audit_run_id': audit_run_id,
            'search_term': n.get('search_term', n.get('term', '')),
            'campaign': n.get('campaign', 'Unknown'),
            'impressions': n.get('impressions', 0),
            'clicks': n.get('clicks', 0),
            'cost': n.get('cost', 0),
            'conversions': n.get('conversions', 0),
            'ctr': n.get('ctr', 0),
            'categories': n.get('categories', []),
            'reasons': n.get('reasons', []),
            'suggested_match_type': n.get('suggested_match_type', ''),
            'priority_score': n.get('priority_score', 0),
            'term_type': 'negative_candidate',
        })

    # Expansion candidates
    for k in kw_candidates:
        all_search_terms.append({
            'audit_run_id': audit_run_id,
            'search_term': k.get('search_term', k.get('term', '')),
            'campaign': k.get('campaign', 'Unknown'),
            'impressions': k.get('impressions', 0),
            'clicks': k.get('clicks', 0),
            'cost': k.get('cost', 0),
            'conversions': k.get('conversions', 0),
            'ctr': k.get('ctr', 0),
            'cpa': k.get('cpa'),
            'term_type': 'expansion_candidate',
        })

    # Top wasted spend terms
    wasted = search_terms.get('top_wasted_spend_terms', [])
    for w in wasted:
        # Skip if already added as negative candidate
        existing = {t['search_term'] for t in all_search_terms}
        if w.get('search_term', '') not in existing:
            all_search_terms.append({
                'audit_run_id': audit_run_id,
                'search_term': w.get('search_term', ''),
                'campaign': w.get('campaign', 'Unknown'),
                'impressions': w.get('impressions', 0),
                'clicks': w.get('clicks', 0),
                'cost': w.get('cost', 0),
                'conversions': w.get('conversions', 0),
                'ctr': w.get('ctr', 0),
                'term_type': 'wasted_spend',
            })

    if all_search_terms:
        # Push in batches of 50 to avoid payload limits
        for i in range(0, len(all_search_terms), 50):
            batch = all_search_terms[i:i+50]
            api_post('search_terms', batch)
        print(f"  Pushed {len(all_search_terms)} search terms")

    # --- 6. Search term summary ---
    summary = search_terms.get('summary', {})
    if summary:
        api_post('search_term_summaries', {
            'audit_run_id': audit_run_id,
            'total_terms': summary.get('total_terms', 0),
            'total_cost': summary.get('total_cost', 0),
            'total_conversions': summary.get('total_conversions', 0),
            'wasted_spend': summary.get('wasted_spend', 0),
            'negative_candidates_count': summary.get('negative_candidates_count', 0),
            'expansion_candidates_count': summary.get('expansion_candidates_count', 0),
            'category_breakdown': search_terms.get('category_breakdown', {}),
        })
        print(f"  Pushed search term summary")

    print("Done!")


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python push_to_supabase.py <report.json>")
        sys.exit(1)
    push_audit(sys.argv[1])
