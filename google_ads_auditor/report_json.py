"""
JSON Report Generator - Structured output for dashboard consumption and API integration.
Produces a single JSON document that any dashboard or MarkOps platform can consume.
"""

from datetime import datetime


def generate_json_report(audit_results, search_term_analysis, account_info, config):
    """Generate a structured JSON report for dashboard/API consumption."""

    return {
        "meta": {
            "version": "1.0.0",
            "generated_at": datetime.now().isoformat(),
            "report_date": datetime.now().strftime("%Y-%m-%d"),
            "lookback_days": config.get("audit", {}).get("lookback_days", 30),
            "auditor": "google-ads-auditor",
        },
        "account": {
            "name": account_info.get("name", ""),
            "id": account_info.get("id", ""),
            "currency": account_info.get("currency", "USD"),
            "timezone": account_info.get("timezone", ""),
        },
        "health_score": {
            "overall": audit_results["overall_score"],
            "grade": audit_results["grade"],
            "grade_label": audit_results["grade_label"],
            "total_checks": audit_results["total_checks"],
            "passed": audit_results["passed_checks"],
            "failed": audit_results["failed_checks_count"],
        },
        "categories": _build_categories(audit_results),
        "critical_issues": _build_critical_issues(audit_results),
        "quick_wins": _build_quick_wins(audit_results),
        "search_terms": {
            "summary": {
                "total_terms": search_term_analysis["total_terms"],
                "total_cost": round(search_term_analysis["total_cost"], 2),
                "total_conversions": search_term_analysis["total_conversions"],
                "wasted_spend": round(search_term_analysis["total_wasted_spend"], 2),
                "negative_candidates_count": search_term_analysis["total_negative_candidates"],
                "expansion_candidates_count": search_term_analysis["total_expansion_candidates"],
            },
            "category_breakdown": search_term_analysis.get("category_summary", {}),
            "negative_keyword_candidates": _build_negative_candidates(search_term_analysis),
            "keyword_expansion_candidates": _build_expansion_candidates(search_term_analysis),
            "top_wasted_spend_terms": _build_wasted_terms(search_term_analysis),
        },
        "all_checks": [
            {
                "id": c["check_id"],
                "name": c["name"],
                "category": c["category"],
                "severity": c["severity"],
                "passed": c["passed"],
                "details": c["details"],
                "recommendation": c["recommendation"],
                "impact": c.get("impact", ""),
                "fix_time_minutes": c.get("fix_time_minutes", 0),
                "quick_fix": c.get("quick_fix", False),
            }
            for c in audit_results["all_checks"]
        ],
        "trends": {
            "_note": "Populate with historical data for week-over-week comparison",
            "previous_score": None,
            "score_delta": None,
            "previous_failed_count": None,
            "failed_delta": None,
        },
    }


def _build_categories(results):
    cat_names = {
        "conversion_tracking": "Conversion Tracking",
        "wasted_spend": "Wasted Spend & Negatives",
        "account_structure": "Account Structure",
        "keywords_qs": "Keywords & Quality Score",
        "ads_assets": "Ads & Assets",
        "settings_targeting": "Settings & Targeting",
    }
    categories = {}
    from .auditor import grade_from_score
    for cat_key, details in results["category_details"].items():
        g, label = grade_from_score(details["score"])
        categories[cat_key] = {
            "display_name": cat_names.get(cat_key, cat_key),
            "weight": details["weight"],
            "score": details["score"],
            "grade": g,
            "checks_total": details["checks"],
            "checks_passed": details["passed"],
            "checks_failed": details.get("failed", 0),
        }
    return categories


def _build_critical_issues(results):
    return [
        {
            "id": c["check_id"],
            "name": c["name"],
            "category": c["category"],
            "details": c["details"],
            "recommendation": c["recommendation"],
            "impact": c.get("impact", ""),
            "fix_time_minutes": c.get("fix_time_minutes", 0),
        }
        for c in results["failed_checks"]
        if c["severity"] == "critical"
    ]


def _build_quick_wins(results):
    return [
        {
            "id": c["check_id"],
            "name": c["name"],
            "severity": c["severity"],
            "recommendation": c["recommendation"],
            "fix_time_minutes": c.get("fix_time_minutes", 0),
        }
        for c in results["quick_wins"]
    ]


def _build_negative_candidates(analysis):
    return [
        {
            "search_term": c["search_term"],
            "campaign": c["campaign_name"],
            "cost": round(c["cost"], 2),
            "clicks": c["clicks"],
            "conversions": c["conversions"],
            "categories": c["categories"],
            "reasons": c["reasons"],
            "suggested_match_type": c["suggested_match_type"],
            "priority_score": round(c["priority_score"], 2),
        }
        for c in analysis.get("negative_candidates", [])[:50]
    ]


def _build_expansion_candidates(analysis):
    return [
        {
            "search_term": c["search_term"],
            "campaign": c["campaign_name"],
            "clicks": c["clicks"],
            "conversions": c["conversions"],
            "cost": round(c["cost"], 2),
            "cpa": round(c["cpa"], 2) if c.get("cpa") else None,
        }
        for c in analysis.get("keyword_expansion_candidates", [])[:30]
    ]


def _build_wasted_terms(analysis):
    return [
        {
            "search_term": t["search_term"],
            "campaign": t["campaign_name"],
            "clicks": t["clicks"],
            "cost": round(t["cost"], 2),
            "ctr": round(t["ctr"], 2),
        }
        for t in analysis.get("wasted_spend_terms", [])[:30]
    ]
