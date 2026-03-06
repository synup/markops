"""
Cloud Server - HTTP endpoint for Google Cloud Run.
Triggered by Cloud Scheduler every Friday at 9 AM EST.
Also exposes /health and /api/audit endpoints for dashboard integration.
"""

import json
import logging
import os
import re
import tempfile
from datetime import datetime
from urllib.parse import urlparse
from flask import Flask, jsonify, request

# Configure logging (server-side only - never expose to clients)
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)


@app.after_request
def add_security_headers(response):
    """Add security headers to all responses."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Content-Security-Policy"] = "default-src 'none'"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Cache-Control"] = "no-store"
    return response


# --- Security Helpers ---

def _validate_webhook_url(url):
    """Validate webhook URL to prevent SSRF attacks."""
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("https", "http"):
            return False
        hostname = parsed.hostname or ""
        # Block internal/private network ranges
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


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "google-ads-auditor", "version": "1.0.0"})


@app.route("/run", methods=["POST"])
def run_audit():
    """
    Main endpoint - triggered by Cloud Scheduler.
    Runs the full audit pipeline: fetch data -> audit -> generate reports -> email.
    """
    try:
        from google_ads_client import load_config
        config = load_config()
        _apply_env_overrides(config)

        # Determine mode
        dry_run = request.args.get("dry_run", "false").lower() == "true"
        no_email = request.args.get("no_email", "false").lower() == "true"
        json_only = request.args.get("json_only", "false").lower() == "true"

        # Fetch data
        if dry_run:
            from run_audit import _get_sample_data
            data, account_info = _get_sample_data()
        else:
            from google_ads_client import (
                get_client, fetch_account_info, fetch_campaign_data,
                fetch_ad_group_data, fetch_keyword_data, fetch_search_terms,
                fetch_ad_data, fetch_extensions, fetch_negative_keywords,
                fetch_negative_keyword_lists, fetch_conversion_actions,
                fetch_pmax_asset_groups,
            )
            client = get_client(config)
            customer_id = config["google_ads"]["customer_id"]
            lookback = config.get("audit", {}).get("lookback_days", 30)

            account_info = fetch_account_info(client, customer_id)
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

        # Run audit
        from auditor import GoogleAdsAuditor
        auditor = GoogleAdsAuditor(config)
        auditor.load_data(data)
        audit_results = auditor.run_audit()

        # Search term analysis
        from search_term_analyzer import analyze_search_terms
        search_analysis = analyze_search_terms(
            data.get("search_terms", []),
            data.get("keywords", []),
            config.get("audit", {})
        )

        # Generate JSON (always)
        from report_json import generate_json_report
        json_output = generate_json_report(audit_results, search_analysis, account_info, config)

        if not json_only:
            with tempfile.TemporaryDirectory() as tmpdir:
                date_str = datetime.now().strftime("%Y-%m-%d")
                excel_path = os.path.join(tmpdir, f"google_ads_audit_{date_str}.xlsx")
                pdf_path = os.path.join(tmpdir, f"google_ads_audit_{date_str}.pdf")

                from report_excel import generate_excel_report
                generate_excel_report(audit_results, search_analysis, account_info, config, excel_path)

                from report_pdf import generate_pdf_report
                generate_pdf_report(audit_results, search_analysis, account_info, config, pdf_path)

                if not no_email:
                    from email_sender import send_report_email
                    send_report_email(config, audit_results, excel_path, pdf_path)

        # Webhook delivery (with SSRF protection)
        webhook_url = os.environ.get("AUDIT_WEBHOOK_URL")
        if webhook_url:
            if _validate_webhook_url(webhook_url):
                _post_webhook(webhook_url, json_output)
            else:
                logger.warning(f"Blocked webhook to disallowed URL")

        return jsonify({
            "status": "success",
            "score": audit_results["overall_score"],
            "grade": audit_results["grade"],
            "checks_passed": audit_results["passed_checks"],
            "checks_failed": audit_results["failed_checks_count"],
            "wasted_spend": search_analysis["total_wasted_spend"],
            "negative_candidates": search_analysis["total_negative_candidates"],
        }), 200

    except Exception as e:
        logger.exception("Audit run failed")
        return jsonify({"status": "error", "message": "Internal server error. Check server logs for details."}), 500


@app.route("/api/audit", methods=["GET"])
def api_audit():
    """
    API endpoint for dashboard consumption.
    Returns full JSON audit results. Designed for your MarkOps dashboard to poll or fetch.
    Query params:
        ?dry_run=true  - use sample data
    """
    try:
        from google_ads_client import load_config
        config = load_config()
        _apply_env_overrides(config)

        dry_run = request.args.get("dry_run", "false").lower() == "true"

        if dry_run:
            from run_audit import _get_sample_data
            data, account_info = _get_sample_data()
        else:
            from google_ads_client import (
                get_client, fetch_account_info, fetch_campaign_data,
                fetch_ad_group_data, fetch_keyword_data, fetch_search_terms,
                fetch_ad_data, fetch_extensions, fetch_negative_keywords,
                fetch_negative_keyword_lists, fetch_conversion_actions,
                fetch_pmax_asset_groups,
            )
            client = get_client(config)
            customer_id = config["google_ads"]["customer_id"]
            lookback = config.get("audit", {}).get("lookback_days", 30)
            account_info = fetch_account_info(client, customer_id)
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

        from auditor import GoogleAdsAuditor
        auditor = GoogleAdsAuditor(config)
        auditor.load_data(data)
        audit_results = auditor.run_audit()

        from search_term_analyzer import analyze_search_terms
        search_analysis = analyze_search_terms(
            data.get("search_terms", []),
            data.get("keywords", []),
            config.get("audit", {})
        )

        from report_json import generate_json_report
        json_output = generate_json_report(audit_results, search_analysis, account_info, config)

        return jsonify(json_output), 200

    except Exception as e:
        logger.exception("API audit failed")
        return jsonify({"status": "error", "message": "Internal server error. Check server logs for details."}), 500


@app.route("/api/latest", methods=["GET"])
def api_latest():
    """
    Returns the most recent JSON report from disk (if available).
    Useful for dashboards that want cached results without re-running the audit.
    """
    reports_dir = os.path.join(os.path.dirname(__file__), "reports")
    if not os.path.exists(reports_dir):
        return jsonify({"status": "error", "message": "No reports directory found"}), 404

    # Only allow files matching expected naming pattern
    valid_pattern = re.compile(r"^google_ads_audit_\d{4}-\d{2}-\d{2}\.json$")
    json_files = sorted(
        [f for f in os.listdir(reports_dir) if valid_pattern.match(f)],
        reverse=True
    )
    if not json_files:
        return jsonify({"status": "error", "message": "No JSON reports found. Run an audit first."}), 404

    latest = os.path.join(reports_dir, json_files[0])
    with open(latest, "r") as f:
        data = json.load(f)
    return jsonify(data), 200


def _apply_env_overrides(config):
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


def _post_webhook(url, payload):
    import urllib.request
    try:
        data = json.dumps(payload, default=str).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
        urllib.request.urlopen(req, timeout=30)
        logger.info("Webhook delivered successfully")
    except Exception as e:
        logger.error(f"Webhook delivery failed: {type(e).__name__}")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)), debug=False)
