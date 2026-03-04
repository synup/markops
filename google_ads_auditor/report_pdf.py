"""
PDF Report Generator - Creates executive summary PDF with grades and recommendations.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from datetime import datetime


DARK_BLUE = HexColor("#1B365D")
BLUE = HexColor("#2E75B6")
LIGHT_BLUE = HexColor("#D6E4F0")
GREEN = HexColor("#70AD47")
LIGHT_GREEN = HexColor("#E2EFDA")
YELLOW = HexColor("#FFC000")
ORANGE = HexColor("#ED7D31")
RED = HexColor("#FF0000")
LIGHT_RED = HexColor("#FCE4EC")
GRAY = HexColor("#808080")
LIGHT_GRAY = HexColor("#F2F2F2")

GRADE_COLORS = {"A": GREEN, "B": HexColor("#92D050"), "C": YELLOW, "D": ORANGE, "F": RED}

CAT_NAMES = {
    "conversion_tracking": "Conversion Tracking",
    "wasted_spend": "Wasted Spend & Negatives",
    "account_structure": "Account Structure",
    "keywords_qs": "Keywords & Quality Score",
    "ads_assets": "Ads & Assets",
    "settings_targeting": "Settings & Targeting",
}


def _get_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("MainTitle", parent=styles["Title"], fontSize=24, textColor=DARK_BLUE, spaceAfter=6))
    styles.add(ParagraphStyle("SubTitle", parent=styles["Normal"], fontSize=12, textColor=GRAY, alignment=TA_CENTER, spaceAfter=20))
    styles.add(ParagraphStyle("SectionTitle", parent=styles["Heading1"], fontSize=16, textColor=DARK_BLUE, spaceBefore=20, spaceAfter=10))
    styles.add(ParagraphStyle("SubSection", parent=styles["Heading2"], fontSize=13, textColor=BLUE, spaceBefore=12, spaceAfter=8))
    styles["BodyText"].fontSize = 10
    styles["BodyText"].leading = 14
    styles["BodyText"].spaceAfter = 6
    styles.add(ParagraphStyle("SmallText", parent=styles["Normal"], fontSize=8, textColor=GRAY))
    styles.add(ParagraphStyle("BoldBody", parent=styles["Normal"], fontSize=10, leading=14, spaceAfter=4, fontName="Helvetica-Bold"))
    styles.add(ParagraphStyle("GradeText", parent=styles["Normal"], fontSize=48, fontName="Helvetica-Bold", alignment=TA_CENTER))
    styles.add(ParagraphStyle("ScoreText", parent=styles["Normal"], fontSize=14, alignment=TA_CENTER, textColor=DARK_BLUE))
    return styles


def generate_pdf_report(audit_results, search_term_analysis, account_info, config, output_path):
    doc = SimpleDocTemplate(
        output_path, pagesize=letter,
        leftMargin=0.75*inch, rightMargin=0.75*inch,
        topMargin=0.75*inch, bottomMargin=0.75*inch
    )
    styles = _get_styles()
    story = []

    # COVER / HEADER
    story.append(Paragraph("Google Ads Audit Report", styles["MainTitle"]))
    story.append(Paragraph(
        f"Account: {account_info.get('name', 'N/A')} | ID: {account_info.get('id', 'N/A')}<br/>"
        f"Report Date: {datetime.now().strftime('%B %d, %Y')} | Period: Last {config.get('audit', {}).get('lookback_days', 30)} days",
        styles["SubTitle"]
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=DARK_BLUE))
    story.append(Spacer(1, 20))

    # OVERALL SCORE - Side-by-side layout: score badge left, grade info right
    grade_color = GRADE_COLORS.get(audit_results["grade"], GRAY)

    score_badge = Paragraph(
        f"<font size='48'><b>{audit_results['overall_score']}</b></font>",
        ParagraphStyle("ScoreBadge", parent=styles["Normal"], alignment=TA_CENTER, textColor=white, leading=56)
    )
    grade_info_top = Paragraph(
        f"<font size='28'><b>Grade: {audit_results['grade']}</b></font>",
        ParagraphStyle("GradeInfoTop", parent=styles["Normal"], alignment=TA_CENTER, textColor=grade_color, leading=36)
    )
    grade_info_bottom = Paragraph(
        f"<font size='16'>{audit_results['grade_label']}</font>",
        ParagraphStyle("GradeInfoBottom", parent=styles["Normal"], alignment=TA_CENTER, textColor=GRAY, leading=22)
    )
    grade_block = Table(
        [[grade_info_top], [grade_info_bottom]],
        colWidths=[3.5*inch]
    )
    grade_block.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))

    score_row = Table(
        [[score_badge, grade_block]],
        colWidths=[2.5*inch, 4.5*inch],
        rowHeights=[1.2*inch]
    )
    score_row.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), grade_color),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ROUNDEDCORNERS", [8, 8, 8, 8]),
        ("BOX", (0, 0), (-1, -1), 1.5, grade_color),
        ("LINEAFTER", (0, 0), (0, 0), 1.5, grade_color),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(score_row)
    story.append(Spacer(1, 16))

    # Summary stats - 4-column metrics bar
    summary_data = [
        ["Total Checks", "Passed", "Failed", "Quick Wins"],
        [str(audit_results["total_checks"]), str(audit_results["passed_checks"]),
         str(audit_results["failed_checks_count"]), str(len(audit_results["quick_wins"]))],
    ]
    summary_table = Table(summary_data, colWidths=[1.75*inch]*4)
    summary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("FONTSIZE", (0, 1), (-1, 1), 20),
        ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 1), (0, 1), DARK_BLUE),
        ("TEXTCOLOR", (1, 1), (1, 1), GREEN),
        ("TEXTCOLOR", (2, 1), (2, 1), RED),
        ("TEXTCOLOR", (3, 1), (3, 1), ORANGE),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 1, GRAY),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 1), (-1, 1), 12),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 12),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))

    # CATEGORY BREAKDOWN
    story.append(Paragraph("Category Breakdown", styles["SectionTitle"]))

    cat_data = [["Category", "Weight", "Score", "Grade"]]
    from .auditor import grade_from_score
    for cat, details in audit_results["category_details"].items():
        g, _ = grade_from_score(details["score"])
        cat_data.append([
            CAT_NAMES.get(cat, cat),
            f"{details['weight']*100:.0f}%",
            f"{details['score']:.1f}",
            g,
        ])

    cat_table = Table(cat_data, colWidths=[3*inch, 1*inch, 1*inch, 1*inch])
    table_style = [
        ("BACKGROUND", (0, 0), (-1, 0), DARK_BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (1, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, GRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for i in range(1, len(cat_data)):
        g = cat_data[i][3]
        gc = GRADE_COLORS.get(g, GRAY)
        table_style.append(("BACKGROUND", (3, i), (3, i), gc))
        table_style.append(("TEXTCOLOR", (3, i), (3, i), white))
        table_style.append(("FONTNAME", (3, i), (3, i), "Helvetica-Bold"))
        if i % 2 == 0:
            table_style.append(("BACKGROUND", (0, i), (2, i), LIGHT_GRAY))

    cat_table.setStyle(TableStyle(table_style))
    story.append(cat_table)
    story.append(PageBreak())

    # CRITICAL FAILURES
    critical_fails = [c for c in audit_results["failed_checks"] if c["severity"] == "critical"]
    if critical_fails:
        story.append(Paragraph("Critical Issues", styles["SectionTitle"]))
        story.append(Paragraph("These issues have the highest impact on your account performance and should be addressed immediately.", styles["BodyText"]))

        for i, check in enumerate(critical_fails):
            story.append(Paragraph(f"<b>{check['check_id']}: {check['name']}</b>", styles["BoldBody"]))
            story.append(Paragraph(f"Details: {check['details']}", styles["BodyText"]))
            if check["recommendation"]:
                story.append(Paragraph(f"Action: {check['recommendation']}", styles["BodyText"]))
            if check.get("impact"):
                story.append(Paragraph(f"Impact: {check['impact']}", styles["BodyText"]))
            story.append(Spacer(1, 8))

    # QUICK WINS
    if audit_results["quick_wins"]:
        story.append(Paragraph("Quick Wins", styles["SectionTitle"]))
        story.append(Paragraph("These fixes can be implemented in under 15 minutes each for immediate improvement.", styles["BodyText"]))

        qw_data = [["#", "Issue", "Severity", "Fix Time"]]
        for i, qw in enumerate(audit_results["quick_wins"]):
            qw_data.append([str(i+1), f"{qw['check_id']}: {qw['name']}", qw["severity"].upper(), f"{qw['fix_time_minutes']} min"])

        qw_table = Table(qw_data, colWidths=[0.4*inch, 4*inch, 1*inch, 0.8*inch])
        qw_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), GREEN),
            ("TEXTCOLOR", (0, 0), (-1, 0), white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ALIGN", (0, 0), (0, -1), "CENTER"),
            ("ALIGN", (2, 0), (-1, -1), "CENTER"),
            ("GRID", (0, 0), (-1, -1), 0.5, GRAY),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GRAY]),
        ]))
        story.append(qw_table)

    story.append(PageBreak())

    # SEARCH TERM ANALYSIS
    story.append(Paragraph("Search Term Analysis", styles["SectionTitle"]))

    st_stats = [
        ["Total Terms", "Wasted Spend", "Negative Candidates", "Expansion Candidates"],
        [str(search_term_analysis["total_terms"]),
         f"${search_term_analysis['total_wasted_spend']:,.2f}",
         str(search_term_analysis["total_negative_candidates"]),
         str(search_term_analysis["total_expansion_candidates"])],
    ]
    st_table = Table(st_stats, colWidths=[1.75*inch]*4)
    st_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ORANGE),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, 1), 14),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, GRAY),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(st_table)
    story.append(Spacer(1, 15))

    # Top negative keyword suggestions
    if search_term_analysis["negative_candidates"]:
        story.append(Paragraph("Top Negative Keyword Suggestions (Review Before Adding)", styles["SubSection"]))

        neg_data = [["Search Term", "Cost", "Conv.", "Reason"]]
        for neg in search_term_analysis["negative_candidates"][:15]:
            neg_data.append([
                neg["search_term"][:50],
                f"${neg['cost']:.2f}",
                str(int(neg["conversions"])),
                "; ".join(neg["reasons"])[:80],
            ])

        neg_table = Table(neg_data, colWidths=[2.2*inch, 0.8*inch, 0.6*inch, 3.4*inch])
        neg_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), RED),
            ("TEXTCOLOR", (0, 0), (-1, 0), white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, GRAY),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GRAY]),
        ]))
        story.append(neg_table)
        story.append(Spacer(1, 15))

    # Top keyword expansion candidates
    if search_term_analysis["keyword_expansion_candidates"]:
        story.append(Paragraph("Keyword Expansion Opportunities", styles["SubSection"]))

        exp_data = [["Search Term", "Clicks", "Conv.", "CPA"]]
        for exp in search_term_analysis["keyword_expansion_candidates"][:10]:
            exp_data.append([
                exp["search_term"][:50],
                str(exp["clicks"]),
                str(int(exp["conversions"])),
                f"${exp['cpa']:.2f}" if exp["cpa"] else "N/A",
            ])

        exp_table = Table(exp_data, colWidths=[3.5*inch, 1*inch, 1*inch, 1*inch])
        exp_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), GREEN),
            ("TEXTCOLOR", (0, 0), (-1, 0), white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("GRID", (0, 0), (-1, -1), 0.5, GRAY),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT_GREEN]),
        ]))
        story.append(exp_table)

    # FOOTER
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", thickness=1, color=GRAY))
    story.append(Paragraph(
        f"Generated by Google Ads Auditor v1.0 | {datetime.now().strftime('%B %d, %Y %H:%M')} | "
        f"Benchmarks: 2026 Industry Averages",
        styles["SmallText"]
    ))

    doc.build(story)
    return output_path
