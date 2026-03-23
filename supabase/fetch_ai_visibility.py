#!/usr/bin/env python3
"""
AI Visibility Tracker — fetches LLM recommendations and tracks Synup mentions.

Queries GPT-4o and Claude Sonnet for each active keyword (3 reps each),
parses responses for Synup + competitor mentions, writes results to Supabase.

Usage:
  python fetch_ai_visibility.py                  # Create a new run (scheduled)
  python fetch_ai_visibility.py --run-id <UUID>  # Pick up an existing pending run

Requires env vars:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  OPENAI_API_KEY, ANTHROPIC_API_KEY
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError

from error_logger import ErrorLogger

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

MODELS = ['gpt-4o', 'claude-sonnet']
REPS = 3

PROMPT_TEMPLATE = (
    "What are the best tools or platforms for {keyword}? "
    "Please list your top recommendations in order, with a brief explanation "
    "of why each is good. Include any relevant website URLs if you know them."
)

# Cost estimates per 1K tokens (output)
COST_PER_1K = {
    'gpt-4o': 0.01,
    'claude-sonnet': 0.015,
}

logger = ErrorLogger('ai_visibility')

# ---------------------------------------------------------------------------
# Supabase helpers
# ---------------------------------------------------------------------------

def supa_request(method, table, params='', payload=None):
    """Make a request to the Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{table}{params}"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
    }
    data = json.dumps(payload).encode() if payload else None
    req = Request(url, data=data, headers=headers, method=method)
    try:
        with urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except HTTPError as e:
        body = e.read().decode() if e.fp else ''
        print(f"  Supabase {method} {table} ERROR {e.code}: {body}")
        raise


def fetch_active_keywords():
    """Return list of active keyword rows from Supabase."""
    return supa_request('GET', 'ai_visibility_keywords', '?is_active=eq.true&select=id,keyword,category')


def fetch_active_competitors():
    """Return list of active competitors with name and variations."""
    return supa_request('GET', 'ai_visibility_competitors', '?is_active=eq.true&select=name,variations')


def create_run(total_keywords):
    """Insert a new run record, return its id."""
    now = datetime.now(timezone.utc).isoformat()
    rows = supa_request('POST', 'ai_visibility_runs', '', {
        'started_at': now,
        'status': 'running',
        'total_keywords': total_keywords,
        'models_queried': MODELS,
        'reps_per_keyword': REPS,
        'trigger_source': 'scheduled',
    })
    return rows[0]['id'] if rows else None


def pick_up_pending_run(run_id):
    """Mark an existing pending run as 'running' and return its id."""
    now = datetime.now(timezone.utc).isoformat()
    rows = supa_request('PATCH', 'ai_visibility_runs', f'?id=eq.{run_id}', {
        'status': 'running',
        'started_at': now,
    })
    if rows and len(rows) > 0:
        return rows[0]['id']
    return None


def update_run(run_id, status, cost):
    """Mark a run as completed/failed."""
    now = datetime.now(timezone.utc).isoformat()
    supa_request('PATCH', 'ai_visibility_runs', f'?id=eq.{run_id}', {
        'status': status,
        'completed_at': now,
        'estimated_cost': float(round(cost, 4)),
    })


def write_results_batch(results):
    """Write a batch of result rows to Supabase."""
    for i in range(0, len(results), 25):
        batch = results[i:i + 25]
        supa_request('POST', 'ai_visibility_results', '', batch)
    print(f"  Wrote {len(results)} result rows")

# ---------------------------------------------------------------------------
# LLM callers
# ---------------------------------------------------------------------------

def call_openai(prompt):
    """Call OpenAI chat completions, return (text, token_count)."""
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        'Authorization': f'Bearer {OPENAI_API_KEY}',
        'Content-Type': 'application/json',
    }
    body = json.dumps({
        'model': 'gpt-4o',
        'messages': [{'role': 'user', 'content': prompt}],
        'temperature': 0.7,
    }).encode()
    req = Request(url, data=body, headers=headers, method='POST')
    with urlopen(req) as resp:
        data = json.loads(resp.read().decode())
    text = data['choices'][0]['message']['content']
    tokens = data.get('usage', {}).get('completion_tokens', 0)
    return text, tokens


def call_anthropic(prompt):
    """Call Anthropic messages API, return (text, token_count)."""
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
    }
    body = json.dumps({
        'model': 'claude-sonnet-4-20250514',
        'max_tokens': 1024,
        'messages': [{'role': 'user', 'content': prompt}],
    }).encode()
    req = Request(url, data=body, headers=headers, method='POST')
    with urlopen(req) as resp:
        data = json.loads(resp.read().decode())
    text = data['content'][0]['text']
    tokens = data.get('usage', {}).get('output_tokens', 0)
    return text, tokens


def call_model(model, prompt):
    """Dispatch to the right LLM caller."""
    if model == 'gpt-4o':
        return call_openai(prompt)
    elif model == 'claude-sonnet':
        return call_anthropic(prompt)
    raise ValueError(f"Unknown model: {model}")

# ---------------------------------------------------------------------------
# Response parsing
# ---------------------------------------------------------------------------

def find_urls(text):
    """Extract all URLs from text."""
    return re.findall(r'https?://[^\s\)\]\},]+', text)


def find_position(text, name):
    """Find numbered position of a brand in a recommendation list."""
    # Match patterns like "1. BrandName", "1) BrandName", "#1 BrandName"
    patterns = [
        rf'(\d+)\.\s+\**{re.escape(name)}\b',
        rf'(\d+)\)\s+\**{re.escape(name)}\b',
        rf'#(\d+)\s+\**{re.escape(name)}\b',
        rf'\*\*(\d+)\.\s+{re.escape(name)}\b',
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            return int(m.group(1))
    return None


def extract_domain(variations):
    """Extract domain from variations array (any entry containing a dot)."""
    for v in (variations or []):
        if '.' in v and ' ' not in v:
            return v
    return None


def parse_brand(text, name, variations=None):
    """Check if a brand is mentioned (using variations) and find its position + URLs."""
    text_lower = text.lower()
    domain = extract_domain(variations)
    mentioned = False
    for v in (variations or [name]):
        if v.lower() in text_lower:
            mentioned = True
            break
    position = find_position(text, name) if mentioned else None
    urls = [u for u in find_urls(text) if domain and domain.lower() in u.lower()] if domain else []
    return {'name': name, 'mentioned': mentioned, 'position': position, 'urls': urls}


def parse_response(text, competitors):
    """Parse an LLM response for Synup + competitor data."""
    synup = parse_brand(text, 'Synup', ['Synup', 'synup.com'])
    comp_data = {}
    for comp in competitors:
        result = parse_brand(text, comp['name'], comp.get('variations', []))
        comp_data[comp['name']] = result

    return {
        'synup_mentioned': synup['mentioned'],
        'synup_position': synup['position'],
        'synup_urls_cited': synup['urls'],
        'competitors_data': comp_data,
        'all_urls_found': find_urls(text),
    }

# ---------------------------------------------------------------------------
# Main execution
# ---------------------------------------------------------------------------

def run_visibility_check(run_id=None):
    """Main entry point: fetch keywords, query models, write results.

    Args:
        run_id: If provided, pick up this existing pending run instead of
                creating a new one. Used by --check-pending cron.
    """
    logger.heartbeat()
    print(f"[{datetime.now()}] Starting AI visibility check...")

    # Validate env
    missing = []
    if not SUPABASE_URL:
        missing.append('SUPABASE_URL')
    if not SUPABASE_KEY:
        missing.append('SUPABASE_SERVICE_ROLE_KEY')
    if not OPENAI_API_KEY:
        missing.append('OPENAI_API_KEY')
    if not ANTHROPIC_API_KEY:
        missing.append('ANTHROPIC_API_KEY')
    if missing:
        msg = f"Missing env vars: {', '.join(missing)}"
        print(msg)
        logger.log_critical(msg)
        sys.exit(1)

    # 1. Fetch keywords and competitors
    keywords = fetch_active_keywords()
    if not keywords:
        print("No active keywords found.")
        return
    competitors = fetch_active_competitors()
    print(f"  Found {len(keywords)} active keywords, {len(competitors)} competitors")

    # 2. Create or pick up run
    if run_id:
        picked = pick_up_pending_run(run_id)
        if not picked:
            logger.log_critical(f"Failed to pick up pending run {run_id}")
            sys.exit(1)
        print(f"  Picked up pending run: {run_id}")
    else:
        run_id = create_run(len(keywords))
        if not run_id:
            logger.log_critical("Failed to create run record")
            sys.exit(1)
        print(f"  Run ID: {run_id}")

    # 3. Query each keyword x model x rep
    results_buffer = []
    total_cost = 0.0
    total_queries = len(keywords) * len(MODELS) * REPS
    completed = 0

    for kw in keywords:
        prompt = PROMPT_TEMPLATE.format(keyword=kw['keyword'])

        for model in MODELS:
            for rep in range(1, REPS + 1):
                completed += 1
                try:
                    text, tokens = call_model(model, prompt)
                    parsed = parse_response(text, competitors)
                    cost = (tokens / 1000) * COST_PER_1K.get(model, 0.01)
                    total_cost += cost

                    results_buffer.append({
                        'run_id': run_id,
                        'keyword_id': kw['id'],
                        'keyword_text': kw['keyword'],
                        'model': model,
                        'repetition': rep,
                        'full_response': text,
                        'synup_mentioned': parsed['synup_mentioned'],
                        'synup_position': parsed['synup_position'],
                        'synup_urls_cited': parsed['synup_urls_cited'],
                        'competitors_data': parsed['competitors_data'],
                        'all_urls_found': parsed['all_urls_found'],
                        'response_tokens': tokens,
                    })

                    print(f"  [{completed}/{total_queries}] {kw['keyword']} | {model} rep{rep} — "
                          f"Synup: {'YES' if parsed['synup_mentioned'] else 'no'}")

                except Exception as e:
                    logger.log_exception(
                        f"Failed: {kw['keyword']} | {model} rep{rep}", e)
                    print(f"  [{completed}/{total_queries}] ERROR: {e}")

                # Rate limiting — small delay between calls
                time.sleep(0.5)

        # Flush buffer every 25 results
        if len(results_buffer) >= 25:
            write_results_batch(results_buffer)
            results_buffer = []

    # Flush remaining
    if results_buffer:
        write_results_batch(results_buffer)

    # 4. Mark run complete
    update_run(run_id, 'completed', total_cost)
    print(f"\nDone! {completed} queries, estimated cost: ${total_cost:.4f}")
    logger.heartbeat()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='AI Visibility Tracker')
    parser.add_argument('--run-id', type=str, default=None,
                        help='Pick up an existing pending run by ID')
    args = parser.parse_args()

    try:
        run_visibility_check(run_id=args.run_id)
    except Exception as e:
        logger.log_exception("AI visibility run failed", e)
        print(f"FATAL: {e}")
        sys.exit(1)
