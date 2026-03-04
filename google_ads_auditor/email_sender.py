"""
Email Sender - Sends audit reports via Gmail SMTP with attachments.
"""

import html
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from datetime import datetime


def send_report_email(config, audit_results, excel_path, pdf_path):
    email_config = config.get("email", {})
    sender = email_config.get("sender_email")
    recipient = email_config.get("recipient_email")
    app_password = email_config.get("gmail_app_password")

    if not all([sender, recipient, app_password]):
        print("Email configuration incomplete. Skipping email delivery.")
        return False

    msg = MIMEMultipart("mixed")
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = _build_subject(audit_results)

    html_body = _build_html_body(audit_results)
    msg.attach(MIMEText(html_body, "html"))

    for filepath in [excel_path, pdf_path]:
        if filepath and os.path.exists(filepath):
            _attach_file(msg, filepath)

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587, timeout=30)
        context = server.starttls()
        if context[0] != 220:
            print("Email send failed: TLS negotiation unsuccessful")
            return False
        server.login(sender, app_password)
        server.send_message(msg)
        server.quit()
        print(f"Report emailed to {recipient}")
        return True
    except smtplib.SMTPAuthenticationError:
        print("Email send failed: Authentication error. Check Gmail App Password.")
        return False
    except smtplib.SMTPException as e:
        print(f"Email send failed: SMTP error ({type(e).__name__})")
        return False
    except Exception:
        print("Email send failed: Unexpected error during delivery")
        return False


def _build_subject(results):
    grade = results["grade"]
    score = results["overall_score"]
    date = datetime.now().strftime("%b %d, %Y")
    return f"Google Ads Audit Report - Grade {grade} ({score}/100) - {date}"


def _build_html_body(results):
    grade = results["grade"]
    score = results["overall_score"]
    grade_colors = {"A": "#70AD47", "B": "#92D050", "C": "#FFC000", "D": "#ED7D31", "F": "#FF0000"}
    color = grade_colors.get(grade, "#808080")

    failed = results["failed_checks_count"]
    quick_wins = len(results["quick_wins"])

    # Category rows
    cat_names = {
        "conversion_tracking": "Conversion Tracking",
        "wasted_spend": "Wasted Spend & Negatives",
        "account_structure": "Account Structure",
        "keywords_qs": "Keywords & Quality Score",
        "ads_assets": "Ads & Assets",
        "settings_targeting": "Settings & Targeting",
    }
    cat_rows = ""
    for cat, details in results["category_details"].items():
        cat_rows += f"""
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{cat_names.get(cat, cat)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">{details['weight']*100:.0f}%</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold;">{details['score']:.1f}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">{details['passed']}/{details['checks']}</td>
        </tr>"""

    # Critical issues
    critical_items = ""
    critical_fails = [c for c in results["failed_checks"] if c["severity"] == "critical"]
    for cf in critical_fails[:5]:
        critical_items += f"""
        <li style="margin-bottom: 8px;">
            <b>{html.escape(str(cf['check_id']))}: {html.escape(str(cf['name']))}</b><br/>
            <span style="color: #666;">{html.escape(str(cf['details']))}</span>
        </li>"""

    # Quick wins
    qw_items = ""
    for qw in results["quick_wins"][:5]:
        qw_items += f"""
        <li style="margin-bottom: 8px;">
            <b>{html.escape(str(qw['check_id']))}: {html.escape(str(qw['name']))}</b> ({qw['fix_time_minutes']} min)
        </li>"""

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; color: #333;">
        <div style="background-color: #1B365D; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Google Ads Audit Report</h1>
            <p style="color: #aaa; margin: 5px 0;">{datetime.now().strftime('%B %d, %Y')}</p>
        </div>

        <div style="text-align: center; padding: 30px 20px; background-color: #f9f9f9;">
            <div style="display: inline-block; background-color: {color}; color: white; width: 120px; height: 120px; border-radius: 60px; line-height: 120px; font-size: 48px; font-weight: bold;">
                {score}
            </div>
            <h2 style="color: {color}; margin: 10px 0 5px;">Grade: {grade} - {results['grade_label']}</h2>
            <p style="color: #666;">{results['total_checks']} checks | {results['passed_checks']} passed | {failed} failed | {quick_wins} quick wins</p>
        </div>

        <div style="padding: 20px;">
            <h3 style="color: #1B365D; border-bottom: 2px solid #1B365D; padding-bottom: 5px;">Category Breakdown</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="background-color: #1B365D; color: white;">
                    <th style="padding: 8px; text-align: left;">Category</th>
                    <th style="padding: 8px; text-align: center;">Weight</th>
                    <th style="padding: 8px; text-align: center;">Score</th>
                    <th style="padding: 8px; text-align: center;">Passed</th>
                </tr>
                {cat_rows}
            </table>
        </div>

        {"<div style='padding: 20px;'><h3 style='color: #FF0000; border-bottom: 2px solid #FF0000; padding-bottom: 5px;'>Critical Issues</h3><ul>" + critical_items + "</ul></div>" if critical_items else ""}

        {"<div style='padding: 20px;'><h3 style='color: #70AD47; border-bottom: 2px solid #70AD47; padding-bottom: 5px;'>Quick Wins</h3><ul>" + qw_items + "</ul></div>" if qw_items else ""}

        <div style="padding: 20px; background-color: #f0f0f0; text-align: center; color: #888; font-size: 12px;">
            <p>Full report attached as Excel and PDF. Review negative keyword suggestions before implementing.</p>
            <p>Generated by Google Ads Auditor v1.0</p>
        </div>
    </body>
    </html>
    """
    return html


def _attach_file(msg, filepath):
    filename = os.path.basename(filepath)
    with open(filepath, "rb") as f:
        part = MIMEBase("application", "octet-stream")
        part.set_payload(f.read())
    encoders.encode_base64(part)
    part.add_header("Content-Disposition", f"attachment; filename={filename}")
    msg.attach(part)
