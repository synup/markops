"""
Google Ads API Client - Handles authentication and data fetching.
Fetches campaign, ad group, keyword, search term, and asset data.
"""

import yaml
import os
from datetime import datetime, timedelta
from google.ads.googleads.client import GoogleAdsClient
from google.ads.googleads.errors import GoogleAdsException


def load_config(config_path=None):
    if config_path is None:
        config_path = os.path.join(os.path.dirname(__file__), "config", "config.yaml")
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def get_client(config):
    credentials = {
        "developer_token": config["google_ads"]["developer_token"],
        "client_id": config["google_ads"]["client_id"],
        "client_secret": config["google_ads"]["client_secret"],
        "refresh_token": config["google_ads"]["refresh_token"],
        "use_proto_plus": True,
    }
    if config["google_ads"].get("login_customer_id"):
        credentials["login_customer_id"] = config["google_ads"]["login_customer_id"]
    return GoogleAdsClient.load_from_dict(credentials)


def _run_query(client, customer_id, query):
    ga_service = client.get_service("GoogleAdsService")
    try:
        response = ga_service.search_stream(customer_id=customer_id, query=query)
        rows = []
        for batch in response:
            for row in batch.results:
                rows.append(row)
        return rows
    except GoogleAdsException as ex:
        print(f"Google Ads API error: {ex.failure.errors[0].message}")
        raise


def fetch_account_info(client, customer_id):
    query = """
        SELECT
            customer.descriptive_name,
            customer.currency_code,
            customer.time_zone,
            customer.id
        FROM customer
        LIMIT 1
    """
    rows = _run_query(client, customer_id, query)
    if rows:
        r = rows[0]
        return {
            "name": r.customer.descriptive_name,
            "currency": r.customer.currency_code,
            "timezone": r.customer.time_zone,
            "id": r.customer.id,
        }
    return {}


def fetch_campaign_data(client, customer_id, lookback_days=30):
    start = (datetime.now() - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
    end = datetime.now().strftime("%Y-%m-%d")

    query = f"""
        SELECT
            campaign.id,
            campaign.name,
            campaign.status,
            campaign.advertising_channel_type,
            campaign.bidding_strategy_type,
            campaign.campaign_budget,
            campaign.target_cpa.target_cpa_micros,
            campaign.target_roas.target_roas,
            campaign.network_settings.target_google_search,
            campaign.network_settings.target_search_network,
            campaign.network_settings.target_content_network,
            campaign.geo_target_type_setting.positive_geo_target_type,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.all_conversions,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_per_conversion,
            metrics.search_impression_share,
            metrics.search_budget_lost_impression_share,
            metrics.search_rank_lost_impression_share,
            metrics.interaction_rate
        FROM campaign
        WHERE segments.date BETWEEN '{start}' AND '{end}'
            AND campaign.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
    """
    rows = _run_query(client, customer_id, query)
    campaigns = []
    for r in rows:
        cost = r.metrics.cost_micros / 1_000_000
        conversions = r.metrics.conversions
        conv_value = r.metrics.conversions_value
        cpa = cost / conversions if conversions > 0 else None
        roas = conv_value / cost if cost > 0 else None
        campaigns.append({
            "id": r.campaign.id,
            "name": r.campaign.name,
            "status": r.campaign.status.name,
            "channel_type": r.campaign.advertising_channel_type.name,
            "bidding_strategy": r.campaign.bidding_strategy_type.name,
            "target_cpa_micros": r.campaign.target_cpa.target_cpa_micros if r.campaign.target_cpa else None,
            "target_roas": r.campaign.target_roas.target_roas if r.campaign.target_roas else None,
            "target_google_search": r.campaign.network_settings.target_google_search,
            "target_search_network": r.campaign.network_settings.target_search_network,
            "target_content_network": r.campaign.network_settings.target_content_network,
            "geo_target_type": r.campaign.geo_target_type_setting.positive_geo_target_type.name if r.campaign.geo_target_type_setting else "UNKNOWN",
            "impressions": r.metrics.impressions,
            "clicks": r.metrics.clicks,
            "cost": cost,
            "conversions": conversions,
            "conversions_value": conv_value,
            "ctr": r.metrics.ctr * 100,
            "avg_cpc": r.metrics.average_cpc / 1_000_000,
            "cpa": cpa,
            "roas": roas,
            "search_impression_share": r.metrics.search_impression_share if r.metrics.search_impression_share else 0,
            "search_budget_lost_is": r.metrics.search_budget_lost_impression_share if r.metrics.search_budget_lost_impression_share else 0,
            "search_rank_lost_is": r.metrics.search_rank_lost_impression_share if r.metrics.search_rank_lost_impression_share else 0,
        })
    return campaigns


def fetch_ad_group_data(client, customer_id, lookback_days=30):
    start = (datetime.now() - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
    end = datetime.now().strftime("%Y-%m-%d")

    query = f"""
        SELECT
            campaign.id,
            campaign.name,
            ad_group.id,
            ad_group.name,
            ad_group.status,
            ad_group.type,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.ctr,
            metrics.average_cpc
        FROM ad_group
        WHERE segments.date BETWEEN '{start}' AND '{end}'
            AND campaign.status != 'REMOVED'
            AND ad_group.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
    """
    rows = _run_query(client, customer_id, query)
    ad_groups = []
    for r in rows:
        cost = r.metrics.cost_micros / 1_000_000
        ad_groups.append({
            "campaign_id": r.campaign.id,
            "campaign_name": r.campaign.name,
            "id": r.ad_group.id,
            "name": r.ad_group.name,
            "status": r.ad_group.status.name,
            "type": r.ad_group.type_.name,
            "impressions": r.metrics.impressions,
            "clicks": r.metrics.clicks,
            "cost": cost,
            "conversions": r.metrics.conversions,
            "conversions_value": r.metrics.conversions_value,
            "ctr": r.metrics.ctr * 100,
            "avg_cpc": r.metrics.average_cpc / 1_000_000,
        })
    return ad_groups


def fetch_keyword_data(client, customer_id, lookback_days=30):
    start = (datetime.now() - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
    end = datetime.now().strftime("%Y-%m-%d")

    query = f"""
        SELECT
            campaign.id,
            campaign.name,
            ad_group.id,
            ad_group.name,
            ad_group_criterion.keyword.text,
            ad_group_criterion.keyword.match_type,
            ad_group_criterion.quality_info.quality_score,
            ad_group_criterion.quality_info.creative_quality_score,
            ad_group_criterion.quality_info.search_predicted_ctr,
            ad_group_criterion.quality_info.post_click_quality_score,
            ad_group_criterion.status,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.ctr,
            metrics.average_cpc,
            metrics.cost_per_conversion
        FROM keyword_view
        WHERE segments.date BETWEEN '{start}' AND '{end}'
            AND campaign.status != 'REMOVED'
            AND ad_group.status != 'REMOVED'
            AND ad_group_criterion.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
    """
    rows = _run_query(client, customer_id, query)
    keywords = []
    for r in rows:
        cost = r.metrics.cost_micros / 1_000_000
        qs = r.ad_group_criterion.quality_info.quality_score if r.ad_group_criterion.quality_info.quality_score else None
        keywords.append({
            "campaign_id": r.campaign.id,
            "campaign_name": r.campaign.name,
            "ad_group_id": r.ad_group.id,
            "ad_group_name": r.ad_group.name,
            "keyword": r.ad_group_criterion.keyword.text,
            "match_type": r.ad_group_criterion.keyword.match_type.name,
            "quality_score": qs,
            "creative_quality": r.ad_group_criterion.quality_info.creative_quality_score.name if r.ad_group_criterion.quality_info.creative_quality_score else "UNKNOWN",
            "expected_ctr": r.ad_group_criterion.quality_info.search_predicted_ctr.name if r.ad_group_criterion.quality_info.search_predicted_ctr else "UNKNOWN",
            "landing_page_exp": r.ad_group_criterion.quality_info.post_click_quality_score.name if r.ad_group_criterion.quality_info.post_click_quality_score else "UNKNOWN",
            "status": r.ad_group_criterion.status.name,
            "impressions": r.metrics.impressions,
            "clicks": r.metrics.clicks,
            "cost": cost,
            "conversions": r.metrics.conversions,
            "conversions_value": r.metrics.conversions_value,
            "ctr": r.metrics.ctr * 100,
            "avg_cpc": r.metrics.average_cpc / 1_000_000,
            "cpa": r.metrics.cost_per_conversion / 1_000_000 if r.metrics.cost_per_conversion else None,
        })
    return keywords


def fetch_search_terms(client, customer_id, lookback_days=30):
    start = (datetime.now() - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
    end = datetime.now().strftime("%Y-%m-%d")

    query = f"""
        SELECT
            campaign.id,
            campaign.name,
            ad_group.id,
            ad_group.name,
            search_term_view.search_term,
            search_term_view.status,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value,
            metrics.ctr,
            metrics.average_cpc
        FROM search_term_view
        WHERE segments.date BETWEEN '{start}' AND '{end}'
            AND campaign.status != 'REMOVED'
            AND metrics.impressions > 0
        ORDER BY metrics.cost_micros DESC
    """
    rows = _run_query(client, customer_id, query)
    terms = []
    for r in rows:
        cost = r.metrics.cost_micros / 1_000_000
        terms.append({
            "campaign_id": r.campaign.id,
            "campaign_name": r.campaign.name,
            "ad_group_id": r.ad_group.id,
            "ad_group_name": r.ad_group.name,
            "search_term": r.search_term_view.search_term,
            "status": r.search_term_view.status.name,
            "impressions": r.metrics.impressions,
            "clicks": r.metrics.clicks,
            "cost": cost,
            "conversions": r.metrics.conversions,
            "conversions_value": r.metrics.conversions_value,
            "ctr": r.metrics.ctr * 100,
            "avg_cpc": r.metrics.average_cpc / 1_000_000,
        })
    return terms


def fetch_ad_data(client, customer_id, lookback_days=30):
    start = (datetime.now() - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
    end = datetime.now().strftime("%Y-%m-%d")

    query = f"""
        SELECT
            campaign.id,
            campaign.name,
            ad_group.id,
            ad_group.name,
            ad_group_ad.ad.id,
            ad_group_ad.ad.type,
            ad_group_ad.ad.responsive_search_ad.headlines,
            ad_group_ad.ad.responsive_search_ad.descriptions,
            ad_group_ad.ad_strength,
            ad_group_ad.status,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.ctr,
            metrics.average_cpc
        FROM ad_group_ad
        WHERE segments.date BETWEEN '{start}' AND '{end}'
            AND campaign.status != 'REMOVED'
            AND ad_group_ad.status != 'REMOVED'
        ORDER BY metrics.impressions DESC
    """
    rows = _run_query(client, customer_id, query)
    ads = []
    for r in rows:
        headlines = []
        descriptions = []
        if r.ad_group_ad.ad.responsive_search_ad:
            rsa = r.ad_group_ad.ad.responsive_search_ad
            if rsa.headlines:
                headlines = [h.text for h in rsa.headlines]
            if rsa.descriptions:
                descriptions = [d.text for d in rsa.descriptions]
        ads.append({
            "campaign_id": r.campaign.id,
            "campaign_name": r.campaign.name,
            "ad_group_id": r.ad_group.id,
            "ad_group_name": r.ad_group.name,
            "ad_id": r.ad_group_ad.ad.id,
            "ad_type": r.ad_group_ad.ad.type_.name,
            "ad_strength": r.ad_group_ad.ad_strength.name if r.ad_group_ad.ad_strength else "UNKNOWN",
            "headlines": headlines,
            "descriptions": descriptions,
            "status": r.ad_group_ad.status.name,
            "impressions": r.metrics.impressions,
            "clicks": r.metrics.clicks,
            "cost": r.metrics.cost_micros / 1_000_000,
            "conversions": r.metrics.conversions,
            "ctr": r.metrics.ctr * 100,
            "avg_cpc": r.metrics.average_cpc / 1_000_000,
        })
    return ads


def fetch_extensions(client, customer_id):
    query = """
        SELECT
            campaign.id,
            campaign.name,
            campaign_asset.field_type,
            asset.type,
            asset.name,
            asset.sitelink_asset.description1,
            asset.sitelink_asset.description2,
            asset.sitelink_asset.link_text,
            asset.callout_asset.callout_text,
            asset.structured_snippet_asset.header,
            asset.call_asset.phone_number
        FROM campaign_asset
        WHERE campaign.status != 'REMOVED'
    """
    rows = _run_query(client, customer_id, query)
    extensions = []
    for r in rows:
        extensions.append({
            "campaign_id": r.campaign.id,
            "campaign_name": r.campaign.name,
            "field_type": r.campaign_asset.field_type.name,
            "asset_type": r.asset.type_.name,
            "asset_name": r.asset.name,
        })
    return extensions


def fetch_negative_keywords(client, customer_id):
    query = """
        SELECT
            campaign.id,
            campaign.name,
            campaign_criterion.keyword.text,
            campaign_criterion.keyword.match_type,
            campaign_criterion.negative
        FROM campaign_criterion
        WHERE campaign_criterion.type = 'KEYWORD'
            AND campaign_criterion.negative = TRUE
            AND campaign.status != 'REMOVED'
    """
    rows = _run_query(client, customer_id, query)
    negatives = []
    for r in rows:
        negatives.append({
            "campaign_id": r.campaign.id,
            "campaign_name": r.campaign.name,
            "keyword": r.campaign_criterion.keyword.text,
            "match_type": r.campaign_criterion.keyword.match_type.name,
        })
    return negatives


def fetch_negative_keyword_lists(client, customer_id):
    query = """
        SELECT
            shared_set.id,
            shared_set.name,
            shared_set.type,
            shared_set.member_count,
            shared_set.status
        FROM shared_set
        WHERE shared_set.type = 'NEGATIVE_KEYWORDS'
            AND shared_set.status = 'ENABLED'
    """
    rows = _run_query(client, customer_id, query)
    lists = []
    for r in rows:
        lists.append({
            "id": r.shared_set.id,
            "name": r.shared_set.name,
            "member_count": r.shared_set.member_count,
        })
    return lists


def fetch_conversion_actions(client, customer_id):
    query = """
        SELECT
            conversion_action.id,
            conversion_action.name,
            conversion_action.type,
            conversion_action.status,
            conversion_action.category,
            conversion_action.counting_type,
            conversion_action.attribution_model_settings.attribution_model,
            conversion_action.include_in_conversions_metric
        FROM conversion_action
        WHERE conversion_action.status != 'REMOVED'
    """
    rows = _run_query(client, customer_id, query)
    actions = []
    for r in rows:
        actions.append({
            "id": r.conversion_action.id,
            "name": r.conversion_action.name,
            "type": r.conversion_action.type_.name,
            "status": r.conversion_action.status.name,
            "category": r.conversion_action.category.name,
            "counting_type": r.conversion_action.counting_type.name,
            "attribution_model": r.conversion_action.attribution_model_settings.attribution_model.name if r.conversion_action.attribution_model_settings else "UNKNOWN",
            "include_in_conversions": r.conversion_action.include_in_conversions_metric,
        })
    return actions


def fetch_pmax_asset_groups(client, customer_id, lookback_days=30):
    start = (datetime.now() - timedelta(days=lookback_days)).strftime("%Y-%m-%d")
    end = datetime.now().strftime("%Y-%m-%d")

    query = f"""
        SELECT
            campaign.id,
            campaign.name,
            asset_group.id,
            asset_group.name,
            asset_group.status,
            metrics.impressions,
            metrics.clicks,
            metrics.cost_micros,
            metrics.conversions,
            metrics.conversions_value
        FROM asset_group
        WHERE segments.date BETWEEN '{start}' AND '{end}'
            AND campaign.advertising_channel_type = 'PERFORMANCE_MAX'
            AND campaign.status != 'REMOVED'
        ORDER BY metrics.cost_micros DESC
    """
    rows = _run_query(client, customer_id, query)
    groups = []
    for r in rows:
        cost = r.metrics.cost_micros / 1_000_000
        groups.append({
            "campaign_id": r.campaign.id,
            "campaign_name": r.campaign.name,
            "id": r.asset_group.id,
            "name": r.asset_group.name,
            "status": r.asset_group.status.name,
            "impressions": r.metrics.impressions,
            "clicks": r.metrics.clicks,
            "cost": cost,
            "conversions": r.metrics.conversions,
            "conversions_value": r.metrics.conversions_value,
        })
    return groups
