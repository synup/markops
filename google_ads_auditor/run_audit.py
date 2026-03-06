#!/usr/bin/env python3
"""
Google Ads Auditor - Main execution script.
Fetches data from Google Ads API, runs 74-check audit, generates Excel + PDF + JSON reports, and emails results.

Usage:
    python -m google_ads_auditor.run_audit
    python -m google_ads_auditor.run_audit --config path/to/config.yaml
    python -m google_ads_auditor.run_audit --dry-run  (uses sample data for testing)
    python -m google_ads_auditor.run_audit --json-only (output JSON for dashboard consumption)
"""

import argparse
import json
import os
import sys
from datetime import datetime


def main():
    parser = argparse.ArgumentParser(description="Google Ads Weekly Auditor")
    parser.add_argument("--config", help="Path to config.yaml", default=None)
    parser.add_argument("--dry-run", action="store_true", help="Use sample data for testing")
    parser.add_argument("--no-email", action="store_true", help="Skip email delivery")
    parser.add_argument("--json-only", action="store_true", help="Output JSON only (for dashboard/API consumption)")
    parser.add_argument("--output-dir", help="Output directory for reports", default=None)
    parser.add_argument("--webhook-url", help="POST JSON results to this webhook URL after audit", default=None)
    args = parser.parse_args()

    from .google_ads_client import load_config
    config = load_config(args.config)

    # Allow env var overrides for cloud deployment
    _apply_env_overrides(config)

    output_dir = args.output_dir or os.path.join(os.path.dirname(__file__), config.get("report", {}).get("output_dir", "reports"))
    os.makedirs(output_dir, exist_ok=True)

    date_str = datetime.now().strftime("%Y-%m-%d")
    excel_path = os.path.join(output_dir, f"google_ads_audit_{date_str}.xlsx")
    pdf_path = os.path.join(output_dir, f"google_ads_audit_{date_str}.pdf")
    json_path = os.path.join(output_dir, f"google_ads_audit_{date_str}.json")

    print("=" * 60)
    print("  GOOGLE ADS WEEKLY AUDITOR")
    print(f"  Date: {datetime.now().strftime('%B %d, %Y %H:%M')}")
    print("=" * 60)

    if args.dry_run:
        print("\n[DRY RUN] Using sample data...")
        data, account_info = _get_sample_data()
    else:
        print("\n[1/7] Connecting to Google Ads API...")
        data, account_info = _fetch_live_data(config)

    print("[2/7] Running 74-check audit...")
    from .auditor import GoogleAdsAuditor
    auditor = GoogleAdsAuditor(config)
    auditor.load_data(data)
    audit_results = auditor.run_audit()

    print(f"       Score: {audit_results['overall_score']}/100 (Grade: {audit_results['grade']})")
    print(f"       Passed: {audit_results['passed_checks']}/{audit_results['total_checks']}")
    print(f"       Failed: {audit_results['failed_checks_count']}")
    print(f"       Quick Wins: {len(audit_results['quick_wins'])}")

    print("[3/7] Analyzing search terms...")
    from .search_term_analyzer import analyze_search_terms
    search_analysis = analyze_search_terms(
        data.get("search_terms", []),
        data.get("keywords", []),
        config.get("audit", {})
    )
    print(f"       Negative candidates: {search_analysis['total_negative_candidates']}")
    print(f"       Wasted spend: ${search_analysis['total_wasted_spend']:,.2f}")
    print(f"       Expansion candidates: {search_analysis['total_expansion_candidates']}")

    # Always generate JSON (dashboard-ready)
    print(f"[4/7] Generating JSON output: {json_path}")
    from .report_json import generate_json_report
    json_output = generate_json_report(audit_results, search_analysis, account_info, config)
    with open(json_path, "w") as f:
        json.dump(json_output, f, indent=2, default=str)

    if not args.json_only:
        print(f"[5/7] Generating Excel report: {excel_path}")
        from .report_excel import generate_excel_report
        generate_excel_report(audit_results, search_analysis, account_info, config, excel_path)

        print(f"[6/7] Generating PDF report: {pdf_path}")
        from .report_pdf import generate_pdf_report
        generate_pdf_report(audit_results, search_analysis, account_info, config, pdf_path)

        if not args.no_email:
            print("[7/7] Sending email report...")
            from .email_sender import send_report_email
            send_report_email(config, audit_results, excel_path, pdf_path)
        else:
            print("[7/7] Email delivery skipped (--no-email)")
    else:
        print("[5/7-7/7] Skipped Excel/PDF/Email (--json-only mode)")

    # Webhook delivery (for dashboard integration, with SSRF protection)
    webhook_url = args.webhook_url or os.environ.get("AUDIT_WEBHOOK_URL")
    if webhook_url:
        if _validate_webhook_url(webhook_url):
            print(f"[POST] Sending results to webhook...")
            _post_webhook(webhook_url, json_output)
        else:
            print("       Webhook URL blocked: internal/private addresses not allowed")

    print("\n" + "=" * 60)
    print("  AUDIT COMPLETE")
    print(f"  JSON:  {json_path}")
    if not args.json_only:
        print(f"  Excel: {excel_path}")
        print(f"  PDF:   {pdf_path}")
    print("=" * 60)

    return audit_results


def _apply_env_overrides(config):
    """Override config values with environment variables (for cloud deployment)."""
    env_map = {
        "GOOGLE_ADS_DEVELOPER_TOKEN": ("google_ads", "developer_token"),
        "GOOGLE_ADS_CLIENT_ID": ("google_ads", "client_id"),
        "GOOGLE_ADS_CLIENT_SECRET": ("google_ads", "client_secret"),
        "GOOGLE_ADS_REFRESH_TOKEN": ("google_ads", "refresh_token"),
        "GOOGLE_ADS_CUSTOMER_ID": ("google_ads", "customer_id"),
        "GOOGLE_ADS_LOGIN_CUSTOMER_ID": ("google_ads", "login_customer_id"),
        "GMAIL_SENDER_EMAIL": ("email", "sender_email"),
        "GMAIL_RECIPIENT_EMAIL": ("email", "recipient_email"),
        "GMAIL_APP_PASSWORD": ("email", "gmail_app_password"),
    }
    for env_key, (section, key) in env_map.items():
        val = os.environ.get(env_key)
        if val:
            if section not in config:
                config[section] = {}
            config[section][key] = val


def _validate_webhook_url(url):
    """Validate webhook URL to prevent SSRF attacks."""
    from urllib.parse import urlparse
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("https", "http"):
            return False
        hostname = parsed.hostname or ""
        blocked = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254."]
        private_prefixes = ["10.", "172.16.", "172.17.", "172.18.", "172.19.",
                           "172.20.", "172.21.", "172.22.", "172.23.", "172.24.",
                           "172.25.", "172.26.", "172.27.", "172.28.", "172.29.",
                           "172.30.", "172.31.", "192.168."]
        if hostname in blocked or any(hostname.startswith(p) for p in private_prefixes):
            return False
        return True
    except Exception:
        return False


def _post_webhook(url, payload):
    """POST audit JSON to a webhook endpoint (for dashboard integration)."""
    import urllib.request
    import urllib.error
    try:
        data = json.dumps(payload, default=str).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            print(f"       Webhook response: {resp.status}")
    except Exception as e:
        print(f"       Webhook delivery failed: {e}")


def _fetch_live_data(config):
    from .google_ads_client import (
        get_client, fetch_account_info, fetch_campaign_data, fetch_ad_group_data,
        fetch_keyword_data, fetch_search_terms, fetch_ad_data, fetch_extensions,
        fetch_negative_keywords, fetch_negative_keyword_lists, fetch_conversion_actions,
        fetch_pmax_asset_groups
    )

    client = get_client(config)
    customer_id = config["google_ads"]["customer_id"]
    lookback = config.get("audit", {}).get("lookback_days", 30)

    account_info = fetch_account_info(client, customer_id)
    print(f"       Account: {account_info.get('name', 'N/A')}")

    data = {
        "campaigns": fetch_campaign_data(client, customer_id, lookback),
        "ad_groups": fetch_ad_group_data(client, customer_id, lookback),
        "keywords": fetch_keyword_data(client, customer_id, lookback),
        "search_terms": fetch_search_terms(client, customer_id, lookback),
        "ads": fetch_ad_data(client, customer_id, lookback),
        "extensions": fetch_extensions(client, customer_id),
        "negative_keywords": fetch_negative_keywords(client, customer_id),
        "negative_keyword_lists": fetch_negative_keyword_lists(client, customer_id),
        "conversion_actions": fetch_conversion_actions(client, customer_id),
        "pmax_asset_groups": fetch_pmax_asset_groups(client, customer_id, lookback),
    }

    print(f"       Campaigns: {len(data['campaigns'])}")
    print(f"       Keywords: {len(data['keywords'])}")
    print(f"       Search terms: {len(data['search_terms'])}")
    print(f"       Ads: {len(data['ads'])}")

    return data, account_info


def _get_sample_data():
    """Generate sample data for dry-run testing."""
    account_info = {
        "name": "Sample Account (Dry Run)",
        "id": "123-456-7890",
        "currency": "USD",
        "timezone": "America/New_York",
    }

    data = {
        "campaigns": [
            {"id": 1, "name": "Google | Search | Brand | US", "status": "ENABLED", "channel_type": "SEARCH",
             "bidding_strategy": "TARGET_CPA", "target_cpa_micros": 25000000, "target_roas": None,
             "target_google_search": True, "target_search_network": False, "target_content_network": False,
             "geo_target_type": "LOCATION_OF_PRESENCE", "impressions": 50000, "clicks": 4500, "cost": 12500,
             "conversions": 180, "conversions_value": 45000, "ctr": 9.0, "avg_cpc": 2.78, "cpa": 69.44,
             "roas": 3.6, "search_impression_share": 0.85, "search_budget_lost_is": 0.05, "search_rank_lost_is": 0.10},
            {"id": 2, "name": "Google | Search | Non-Brand | US", "status": "ENABLED", "channel_type": "SEARCH",
             "bidding_strategy": "MAXIMIZE_CONVERSIONS", "target_cpa_micros": None, "target_roas": None,
             "target_google_search": True, "target_search_network": True, "target_content_network": True,
             "geo_target_type": "AREA_OF_INTEREST", "impressions": 120000, "clicks": 8000, "cost": 45000,
             "conversions": 320, "conversions_value": 80000, "ctr": 6.67, "avg_cpc": 5.63, "cpa": 140.63,
             "roas": 1.78, "search_impression_share": 0.42, "search_budget_lost_is": 0.25, "search_rank_lost_is": 0.33},
            {"id": 3, "name": "Google | PMax | All Products", "status": "ENABLED", "channel_type": "PERFORMANCE_MAX",
             "bidding_strategy": "MAXIMIZE_CONVERSION_VALUE", "target_cpa_micros": None, "target_roas": 3.0,
             "target_google_search": True, "target_search_network": False, "target_content_network": False,
             "geo_target_type": "LOCATION_OF_PRESENCE", "impressions": 200000, "clicks": 6000, "cost": 30000,
             "conversions": 250, "conversions_value": 100000, "ctr": 3.0, "avg_cpc": 5.0, "cpa": 120,
             "roas": 3.33, "search_impression_share": 0, "search_budget_lost_is": 0, "search_rank_lost_is": 0},
        ],
        "ad_groups": [
            {"campaign_id": 1, "campaign_name": "Google | Search | Brand | US", "id": 101, "name": "Brand - Core",
             "status": "ENABLED", "type": "SEARCH_STANDARD", "impressions": 50000, "clicks": 4500,
             "cost": 12500, "conversions": 180, "conversions_value": 45000, "ctr": 9.0, "avg_cpc": 2.78},
            {"campaign_id": 2, "campaign_name": "Google | Search | Non-Brand | US", "id": 201, "name": "Services - General",
             "status": "ENABLED", "type": "SEARCH_STANDARD", "impressions": 60000, "clicks": 4000,
             "cost": 22500, "conversions": 160, "conversions_value": 40000, "ctr": 6.67, "avg_cpc": 5.63},
            {"campaign_id": 2, "campaign_name": "Google | Search | Non-Brand | US", "id": 202, "name": "Services - Specific",
             "status": "ENABLED", "type": "SEARCH_STANDARD", "impressions": 60000, "clicks": 4000,
             "cost": 22500, "conversions": 160, "conversions_value": 40000, "ctr": 6.67, "avg_cpc": 5.63},
        ],
        "keywords": [
            {"campaign_id": 1, "campaign_name": "Brand", "ad_group_id": 101, "ad_group_name": "Brand - Core",
             "keyword": "our brand name", "match_type": "EXACT", "quality_score": 9,
             "creative_quality": "ABOVE_AVERAGE", "expected_ctr": "ABOVE_AVERAGE", "landing_page_exp": "ABOVE_AVERAGE",
             "status": "ENABLED", "impressions": 30000, "clicks": 3000, "cost": 8000, "conversions": 120,
             "conversions_value": 30000, "ctr": 10.0, "avg_cpc": 2.67, "cpa": 66.67},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 201, "ad_group_name": "Services",
             "keyword": "digital marketing agency", "match_type": "PHRASE", "quality_score": 6,
             "creative_quality": "AVERAGE", "expected_ctr": "BELOW_AVERAGE", "landing_page_exp": "AVERAGE",
             "status": "ENABLED", "impressions": 25000, "clicks": 1500, "cost": 9000, "conversions": 45,
             "conversions_value": 11250, "ctr": 6.0, "avg_cpc": 6.0, "cpa": 200},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 201, "ad_group_name": "Services",
             "keyword": "marketing services", "match_type": "BROAD", "quality_score": 4,
             "creative_quality": "BELOW_AVERAGE", "expected_ctr": "BELOW_AVERAGE", "landing_page_exp": "AVERAGE",
             "status": "ENABLED", "impressions": 40000, "clicks": 2000, "cost": 12000, "conversions": 30,
             "conversions_value": 7500, "ctr": 5.0, "avg_cpc": 6.0, "cpa": 400},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 202, "ad_group_name": "Specific",
             "keyword": "seo consultant near me", "match_type": "EXACT", "quality_score": 7,
             "creative_quality": "AVERAGE", "expected_ctr": "AVERAGE", "landing_page_exp": "ABOVE_AVERAGE",
             "status": "ENABLED", "impressions": 15000, "clicks": 1200, "cost": 7000, "conversions": 55,
             "conversions_value": 13750, "ctr": 8.0, "avg_cpc": 5.83, "cpa": 127.27},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 202, "ad_group_name": "Specific",
             "keyword": "ppc management", "match_type": "PHRASE", "quality_score": 3,
             "creative_quality": "BELOW_AVERAGE", "expected_ctr": "BELOW_AVERAGE", "landing_page_exp": "BELOW_AVERAGE",
             "status": "ENABLED", "impressions": 8000, "clicks": 300, "cost": 2500, "conversions": 0,
             "conversions_value": 0, "ctr": 3.75, "avg_cpc": 8.33, "cpa": None},
        ],
        "search_terms": [
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 201, "ad_group_name": "Services",
             "search_term": "digital marketing agency near me", "status": "NONE", "impressions": 5000,
             "clicks": 400, "cost": 2400, "conversions": 15, "conversions_value": 3750, "ctr": 8.0, "avg_cpc": 6.0},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 201, "ad_group_name": "Services",
             "search_term": "free marketing tools", "status": "NONE", "impressions": 3000,
             "clicks": 200, "cost": 1200, "conversions": 0, "conversions_value": 0, "ctr": 6.67, "avg_cpc": 6.0},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 201, "ad_group_name": "Services",
             "search_term": "marketing job openings", "status": "NONE", "impressions": 2000,
             "clicks": 150, "cost": 900, "conversions": 0, "conversions_value": 0, "ctr": 7.5, "avg_cpc": 6.0},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 201, "ad_group_name": "Services",
             "search_term": "how to do marketing yourself", "status": "NONE", "impressions": 4000,
             "clicks": 180, "cost": 1080, "conversions": 0, "conversions_value": 0, "ctr": 4.5, "avg_cpc": 6.0},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 201, "ad_group_name": "Services",
             "search_term": "best seo services for small business", "status": "NONE", "impressions": 8000,
             "clicks": 600, "cost": 3600, "conversions": 25, "conversions_value": 6250, "ctr": 7.5, "avg_cpc": 6.0},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 202, "ad_group_name": "Specific",
             "search_term": "cheap seo services", "status": "NONE", "impressions": 6000,
             "clicks": 300, "cost": 1800, "conversions": 2, "conversions_value": 500, "ctr": 5.0, "avg_cpc": 6.0},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 201, "ad_group_name": "Services",
             "search_term": "marketing agency reviews reddit", "status": "NONE", "impressions": 1500,
             "clicks": 80, "cost": 480, "conversions": 0, "conversions_value": 0, "ctr": 5.33, "avg_cpc": 6.0},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 201, "ad_group_name": "Services",
             "search_term": "what is digital marketing", "status": "NONE", "impressions": 10000,
             "clicks": 250, "cost": 1500, "conversions": 0, "conversions_value": 0, "ctr": 2.5, "avg_cpc": 6.0},
            {"campaign_id": 1, "campaign_name": "Brand", "ad_group_id": 101, "ad_group_name": "Brand - Core",
             "search_term": "our brand name pricing", "status": "NONE", "impressions": 2000,
             "clicks": 500, "cost": 1250, "conversions": 30, "conversions_value": 7500, "ctr": 25.0, "avg_cpc": 2.5},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 201, "ad_group_name": "Services",
             "search_term": "marketing internship salary", "status": "NONE", "impressions": 1000,
             "clicks": 60, "cost": 360, "conversions": 0, "conversions_value": 0, "ctr": 6.0, "avg_cpc": 6.0},
        ],
        "ads": [
            {"campaign_id": 1, "campaign_name": "Brand", "ad_group_id": 101, "ad_group_name": "Brand - Core",
             "ad_id": 1001, "ad_type": "RESPONSIVE_SEARCH_AD", "ad_strength": "EXCELLENT",
             "headlines": ["Brand Name", "Official Site", "Top-Rated Agency", "Get Started Today",
                          "Trusted Experts", "Award-Winning Team", "Book a Call", "See Results"],
             "descriptions": ["Leading digital marketing agency. Results guaranteed.", "Expert team ready to grow your business.",
                             "10+ years of proven results. Contact us today."],
             "status": "ENABLED", "impressions": 50000, "clicks": 4500, "cost": 12500, "conversions": 180, "ctr": 9.0, "avg_cpc": 2.78},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "ad_group_id": 201, "ad_group_name": "Services",
             "ad_id": 2001, "ad_type": "RESPONSIVE_SEARCH_AD", "ad_strength": "AVERAGE",
             "headlines": ["Marketing Services", "Grow Your Business", "Expert Marketing", "Contact Us"],
             "descriptions": ["Professional marketing services for businesses.", "Get a free quote today."],
             "status": "ENABLED", "impressions": 60000, "clicks": 4000, "cost": 22500, "conversions": 160, "ctr": 6.67, "avg_cpc": 5.63},
        ],
        "extensions": [
            {"campaign_id": 1, "campaign_name": "Brand", "field_type": "SITELINK", "asset_type": "SITELINK", "asset_name": "Pricing"},
            {"campaign_id": 1, "campaign_name": "Brand", "field_type": "SITELINK", "asset_type": "SITELINK", "asset_name": "Services"},
            {"campaign_id": 1, "campaign_name": "Brand", "field_type": "CALLOUT", "asset_type": "CALLOUT", "asset_name": "Free Consultation"},
            {"campaign_id": 1, "campaign_name": "Brand", "field_type": "CALLOUT", "asset_type": "CALLOUT", "asset_name": "24/7 Support"},
        ],
        "negative_keywords": [
            {"campaign_id": 2, "campaign_name": "Non-Brand", "keyword": "free", "match_type": "BROAD"},
            {"campaign_id": 2, "campaign_name": "Non-Brand", "keyword": "jobs", "match_type": "BROAD"},
        ],
        "negative_keyword_lists": [
            {"id": 1, "name": "Global Negatives", "member_count": 50},
        ],
        "conversion_actions": [
            {"id": 1, "name": "Website Lead Form", "type": "WEBPAGE", "status": "ENABLED", "category": "LEAD",
             "counting_type": "ONE_PER_CLICK", "attribution_model": "DATA_DRIVEN", "include_in_conversions": True},
            {"id": 2, "name": "Phone Call", "type": "AD_CALL", "status": "ENABLED", "category": "LEAD",
             "counting_type": "ONE_PER_CLICK", "attribution_model": "DATA_DRIVEN", "include_in_conversions": True},
        ],
        "pmax_asset_groups": [
            {"campaign_id": 3, "campaign_name": "PMax", "id": 301, "name": "All Products",
             "status": "ENABLED", "impressions": 100000, "clicks": 3000, "cost": 15000, "conversions": 125, "conversions_value": 50000},
            {"campaign_id": 3, "campaign_name": "PMax", "id": 302, "name": "Top Sellers",
             "status": "ENABLED", "impressions": 100000, "clicks": 3000, "cost": 15000, "conversions": 125, "conversions_value": 50000},
        ],
    }

    return data, account_info


if __name__ == "__main__":
    main()
