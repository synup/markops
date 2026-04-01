#!/usr/bin/env python3
"""
Workspace User Sync — fetches users from Google Workspace Admin SDK
and upserts into es_workspace_users table in Supabase.

Runs daily at 2am via cron. Checks es_settings.auto_import_enabled flag
before proceeding — exits early if disabled.

Environment variables (from /opt/google-ads-auditor/.env):
  GOOGLE_SERVICE_ACCOUNT_JSON  — stringified JSON key
  GOOGLE_ADMIN_EMAIL           — super admin email for DWD impersonation
  SUPABASE_URL                 — Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY    — service role key (full access)
"""

import json
import os
import sys
from datetime import datetime, timezone

import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build


def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    print(f"[{ts}] {msg}", flush=True)


def get_env(key: str) -> str:
    val = os.environ.get(key)
    if not val:
        log(f"ERROR: {key} not set")
        sys.exit(1)
    return val


def check_auto_import_enabled(supabase_url: str, headers: dict) -> bool:
    """Check es_settings table for auto_import_enabled flag."""
    resp = requests.get(
        f"{supabase_url}/rest/v1/es_settings?key=eq.auto_import_enabled&select=value",
        headers=headers,
    )
    if resp.status_code != 200:
        log(f"WARNING: Could not read es_settings ({resp.status_code}), proceeding anyway")
        return True
    rows = resp.json()
    if not rows:
        return True  # no setting = default enabled
    return rows[0].get("value", "true").lower() == "true"


def fetch_google_users(sa_json: dict, admin_email: str) -> list[dict]:
    """Fetch all users from Google Workspace via Admin SDK."""
    creds = service_account.Credentials.from_service_account_info(
        sa_json,
        scopes=["https://www.googleapis.com/auth/admin.directory.user.readonly"],
        subject=admin_email,
    )
    service = build("admin", "directory_v1", credentials=creds)

    all_users = []
    page_token = None
    while True:
        resp = (
            service.users()
            .list(
                customer="my_customer",
                maxResults=200,
                orderBy="email",
                projection="full",
                pageToken=page_token,
            )
            .execute()
        )
        all_users.extend(resp.get("users", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            break

    return all_users


def extract_phone(user: dict, phone_type: str) -> str | None:
    for phone in user.get("phones", []):
        if phone.get("type") == phone_type:
            return phone.get("value")
    return None


def upsert_users(
    google_users: list[dict], supabase_url: str, headers: dict
) -> dict:
    """Upsert Google users into es_workspace_users. Returns stats."""
    stats = {"synced": 0, "new": 0, "updated": 0, "errors": []}
    now = datetime.now(timezone.utc).isoformat()

    for gu in google_users:
        orgs = gu.get("organizations", [])
        row = {
            "google_id": gu["id"],
            "email": gu["primaryEmail"],
            "first_name": gu.get("name", {}).get("givenName"),
            "last_name": gu.get("name", {}).get("familyName"),
            "job_title": orgs[0].get("title") if orgs else None,
            "department": orgs[0].get("department") if orgs else None,
            "phone_mobile": extract_phone(gu, "mobile"),
            "phone_work": extract_phone(gu, "work"),
            "org_unit": gu.get("orgUnitPath"),
            "is_active": not gu.get("suspended", False),
            "last_synced_at": now,
        }

        # Upsert on google_id conflict
        resp = requests.post(
            f"{supabase_url}/rest/v1/es_workspace_users",
            headers={
                **headers,
                "Prefer": "resolution=merge-duplicates,return=representation",
            },
            json=row,
        )

        if resp.status_code in (200, 201):
            stats["synced"] += 1
            result = resp.json()
            if isinstance(result, list) and result:
                created = result[0].get("created_at", "")
                synced = result[0].get("last_synced_at", "")
                # If created_at and last_synced_at are very close, it's new
                if created and synced and created[:16] == synced[:16]:
                    stats["new"] += 1
                else:
                    stats["updated"] += 1
        else:
            err = f"{gu['primaryEmail']}: {resp.status_code} {resp.text[:200]}"
            stats["errors"].append(err)
            log(f"  ERROR: {err}")

    return stats


def main() -> None:
    log("=== Workspace User Sync started ===")

    # Load env
    sa_raw = get_env("GOOGLE_ES_SERVICE_ACCOUNT_JSON")
    admin_email = get_env("GOOGLE_ADMIN_EMAIL")
    supabase_url = get_env("SUPABASE_URL")
    supabase_key = get_env("SUPABASE_SERVICE_ROLE_KEY")

    sa_json = json.loads(sa_raw)

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json",
    }

    # Check if auto-import is enabled
    if not check_auto_import_enabled(supabase_url, headers):
        log("Auto-import disabled in es_settings. Exiting.")
        return

    # Fetch from Google
    log("Fetching users from Google Workspace...")
    google_users = fetch_google_users(sa_json, admin_email)
    log(f"Fetched {len(google_users)} users from Google Workspace")

    # Upsert into Supabase
    log("Upserting into es_workspace_users...")
    stats = upsert_users(google_users, supabase_url, headers)

    log(f"Sync complete: {stats['synced']} synced, {stats['new']} new, {stats['updated']} updated")
    if stats["errors"]:
        log(f"Errors: {len(stats['errors'])}")
        for err in stats["errors"][:10]:
            log(f"  - {err}")

    log("=== Workspace User Sync finished ===")


if __name__ == "__main__":
    main()
