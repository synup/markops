"""
Search Term Analyzer - Detects keywords/phrases that should be added as negative keywords.
Categorizes search terms by intent, relevance, and performance.
"""

import re
from collections import Counter


# Common irrelevant term patterns
IRRELEVANT_PATTERNS = {
    "job_seekers": ["job", "jobs", "career", "careers", "hiring", "salary", "resume", "employment", "internship", "vacancy"],
    "free_seekers": ["free", "gratis", "no cost", "complimentary", "freeware", "open source"],
    "diy_learners": ["how to", "tutorial", "course", "learn", "training", "certification", "class", "lesson", "guide", "diy"],
    "competitors": [],  # Populated dynamically
    "informational": ["what is", "what are", "definition", "meaning", "wikipedia", "wiki", "reddit", "quora", "forum"],
    "reviews": ["review", "reviews", "comparison", "vs", "versus", "alternative", "alternatives", "complaints"],
    "cheap_seekers": ["cheap", "cheapest", "discount", "coupon", "deal", "deals", "bargain", "budget", "affordable"],
    "unrelated": ["porn", "nude", "xxx", "pirate", "torrent", "hack", "crack", "cheat"],
}


def analyze_search_terms(search_terms, keywords, config):
    """Analyze search terms and identify negative keyword candidates."""
    min_clicks = config.get("min_clicks_search_terms", 5)

    results = {
        "total_terms": len(search_terms),
        "total_cost": sum(t["cost"] for t in search_terms),
        "total_conversions": sum(t["conversions"] for t in search_terms),
        "negative_candidates": [],
        "category_summary": {},
        "top_performers": [],
        "wasted_spend_terms": [],
        "low_ctr_terms": [],
        "high_cpc_terms": [],
        "keyword_expansion_candidates": [],
    }

    # Get existing keyword set for matching
    keyword_set = set(kw["keyword"].lower().strip() for kw in keywords)

    avg_ctr = sum(t["ctr"] for t in search_terms) / len(search_terms) if search_terms else 0
    avg_cpc = sum(t["avg_cpc"] for t in search_terms if t["avg_cpc"]) / len(search_terms) if search_terms else 0
    total_cost = results["total_cost"]

    for term in search_terms:
        st = term["search_term"].lower().strip()
        term["analysis"] = {}

        # Classify by pattern matching
        categories_matched = []
        for category, patterns in IRRELEVANT_PATTERNS.items():
            for pattern in patterns:
                if pattern in st:
                    categories_matched.append(category)
                    break

        term["analysis"]["categories"] = categories_matched

        # Performance flags
        is_high_spend_no_conv = (term["clicks"] >= min_clicks and term["conversions"] == 0 and term["cost"] > 10)
        is_low_ctr = (term["impressions"] >= 100 and term["ctr"] < avg_ctr * 0.3)
        is_high_cpc = (term["avg_cpc"] and term["avg_cpc"] > avg_cpc * 2.0 and term["conversions"] == 0)

        # Determine if this is a negative keyword candidate
        is_negative_candidate = False
        reasons = []

        if categories_matched:
            is_negative_candidate = True
            reasons.append(f"Matches irrelevant pattern(s): {', '.join(categories_matched)}")

        if is_high_spend_no_conv:
            is_negative_candidate = True
            reasons.append(f"${term['cost']:.2f} spent with 0 conversions")

        if is_low_ctr and term["clicks"] >= min_clicks and term["conversions"] == 0:
            is_negative_candidate = True
            reasons.append(f"CTR {term['ctr']:.2f}% is <30% of account average")

        if is_high_cpc and term["cost"] > 20:
            is_negative_candidate = True
            reasons.append(f"CPC ${term['avg_cpc']:.2f} is >2x account average with no conversions")

        term["analysis"]["is_negative_candidate"] = is_negative_candidate
        term["analysis"]["reasons"] = reasons

        if is_negative_candidate:
            # Determine suggested match type
            word_count = len(st.split())
            if word_count <= 2:
                suggested_match = "PHRASE"
            elif any(cat in categories_matched for cat in ["unrelated", "job_seekers"]):
                suggested_match = "EXACT" if word_count > 3 else "PHRASE"
            else:
                suggested_match = "PHRASE"

            # Calculate priority score (higher = more urgent)
            priority = term["cost"] * (1 if term["conversions"] == 0 else 0.3)
            if categories_matched:
                priority *= 1.5
            if "unrelated" in categories_matched:
                priority *= 3.0

            results["negative_candidates"].append({
                "search_term": term["search_term"],
                "campaign_name": term["campaign_name"],
                "ad_group_name": term["ad_group_name"],
                "impressions": term["impressions"],
                "clicks": term["clicks"],
                "cost": term["cost"],
                "conversions": term["conversions"],
                "ctr": term["ctr"],
                "categories": categories_matched,
                "reasons": reasons,
                "suggested_match_type": suggested_match,
                "priority_score": priority,
            })

        # Track wasted spend
        if is_high_spend_no_conv:
            results["wasted_spend_terms"].append(term)

        # Track low CTR
        if is_low_ctr:
            results["low_ctr_terms"].append(term)

        # Track high CPC no conversion
        if is_high_cpc:
            results["high_cpc_terms"].append(term)

        # Identify top performers for keyword expansion
        if term["conversions"] > 0 and st not in keyword_set:
            results["keyword_expansion_candidates"].append({
                "search_term": term["search_term"],
                "campaign_name": term["campaign_name"],
                "impressions": term["impressions"],
                "clicks": term["clicks"],
                "cost": term["cost"],
                "conversions": term["conversions"],
                "conversions_value": term.get("conversions_value", 0),
                "ctr": term["ctr"],
                "cpa": term["cost"] / term["conversions"] if term["conversions"] > 0 else None,
            })

        # Track top performers
        if term["conversions"] >= 1:
            results["top_performers"].append(term)

    # Sort results
    results["negative_candidates"].sort(key=lambda x: x["priority_score"], reverse=True)
    results["wasted_spend_terms"].sort(key=lambda x: x["cost"], reverse=True)
    results["keyword_expansion_candidates"].sort(key=lambda x: x["conversions"], reverse=True)
    results["top_performers"].sort(key=lambda x: x["conversions"], reverse=True)

    # Category summary
    cat_counter = Counter()
    cat_cost = {}
    for neg in results["negative_candidates"]:
        for cat in neg["categories"]:
            cat_counter[cat] += 1
            cat_cost[cat] = cat_cost.get(cat, 0) + neg["cost"]

    results["category_summary"] = {
        cat: {"count": count, "total_cost": round(cat_cost.get(cat, 0), 2)}
        for cat, count in cat_counter.most_common()
    }

    # Summary stats
    results["total_negative_candidates"] = len(results["negative_candidates"])
    results["total_wasted_spend"] = sum(t["cost"] for t in results["wasted_spend_terms"])
    results["total_expansion_candidates"] = len(results["keyword_expansion_candidates"])

    return results


def generate_negative_keyword_suggestions(analysis_results, max_suggestions=50):
    """Generate a prioritized list of negative keyword suggestions."""
    candidates = analysis_results["negative_candidates"][:max_suggestions]

    suggestions = []
    seen_terms = set()

    for cand in candidates:
        term = cand["search_term"].lower().strip()
        if term in seen_terms:
            continue
        seen_terms.add(term)

        # Extract the key negative phrase
        words = term.split()
        if len(words) <= 3:
            neg_phrase = term
        else:
            # Try to extract the most relevant negative words
            for category, patterns in IRRELEVANT_PATTERNS.items():
                for pattern in patterns:
                    if pattern in term:
                        neg_phrase = pattern
                        break
                else:
                    continue
                break
            else:
                neg_phrase = term

        suggestions.append({
            "negative_keyword": neg_phrase,
            "suggested_match_type": cand["suggested_match_type"],
            "triggered_by": cand["search_term"],
            "cost_impact": cand["cost"],
            "categories": cand["categories"],
            "reasons": cand["reasons"],
            "priority": cand["priority_score"],
        })

    return suggestions
