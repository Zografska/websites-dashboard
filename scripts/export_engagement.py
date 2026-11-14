#!/usr/bin/env python3
"""Export raw engagement events from PostHog (ANALYTICS_SPEC §9).

Usage:
    python3 scripts/export_engagement.py [--out analytics_exports] [--env .env]

Needs, in the environment or in a gitignored .env file:
    POSTHOG_PERSONAL_API_KEY   personal key (phx_...) with the Query Read scope only
    POSTHOG_PROJECT_ID         numeric project ID
    POSTHOG_APP_HOST           optional, default https://eu.posthog.com

Writes analytics_exports/<YYYY-MM-DD>/events.parquet and manifest.json.
The key is never printed. Requires: requests, pandas, pyarrow.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from collections.abc import Callable
from datetime import datetime, timezone
from pathlib import Path

PAGE_SIZE = 50_000
MIN_SCHEMA_V = 1

# Keyset paging by timestamp: OFFSET isn't allowed with personal API keys. Rows that share the
# boundary timestamp come back again on the next page and are dropped by uuid.
QUERY = """
SELECT toString(uuid) AS uuid, timestamp, event, properties
FROM events
WHERE toInt(properties.schema_v) >= {min_schema_v}
  AND timestamp >= toDateTime({after})
ORDER BY timestamp ASC, uuid ASC
LIMIT {limit}
""".strip()

Row = tuple[str, str, str, dict]
FetchPage = Callable[[str], list[Row]]


def load_env(path: Path) -> None:
    """Reads KEY=VALUE lines into os.environ without overriding what is already set."""
    if not path.is_file():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


def export_all(fetch_page: FetchPage, page_size: int = PAGE_SIZE) -> list[Row]:
    """Pages through every event. `fetch_page(after)` returns rows with timestamp >= after, oldest first."""
    rows: list[Row] = []
    seen: set[str] = set()
    after = "1970-01-01 00:00:00"
    while True:
        page = fetch_page(after)
        fresh = [r for r in page if r[0] not in seen]
        for r in fresh:
            seen.add(r[0])
        rows.extend(fresh)
        if len(page) < page_size:
            return rows
        if not fresh:
            raise RuntimeError(f"more than {page_size} events share the timestamp {after}; cannot page past it")
        after = page[-1][1]


def posthog_fetcher(host: str, project_id: str, api_key: str) -> FetchPage:
    import requests

    url = f"{host.rstrip('/')}/api/projects/{project_id}/query/"
    session = requests.Session()
    session.headers["Authorization"] = f"Bearer {api_key}"

    def fetch(after: str) -> list[Row]:
        body = {
            "query": {
                "kind": "HogQLQuery",
                "query": QUERY,
                "values": {"min_schema_v": MIN_SCHEMA_V, "after": after, "limit": PAGE_SIZE},
            }
        }
        res = session.post(url, json=body, timeout=120)
        if res.status_code != 200:
            raise RuntimeError(f"PostHog query failed: HTTP {res.status_code}: {res.text[:500]}")
        out: list[Row] = []
        for uuid, timestamp, event, properties in res.json()["results"]:
            props = json.loads(properties) if isinstance(properties, str) else (properties or {})
            out.append((str(uuid), str(timestamp), str(event), props))
        return out

    return fetch


def to_frame(rows: list[Row]):
    import pandas as pd

    records = []
    for uuid, timestamp, event, props in rows:
        # Our own properties only; PostHog internals ($lib, token, distinct_id, ...) stay out.
        own = {k: v for k, v in props.items() if not k.startswith("$") and k not in ("token", "distinct_id")}
        records.append({"uuid": uuid, "timestamp": timestamp, "event": event, **own})
    frame = pd.DataFrame.from_records(records)
    if not frame.empty:
        frame["timestamp"] = pd.to_datetime(frame["timestamp"], utc=True, format="ISO8601")
        frame = frame.sort_values(["timestamp", "uuid"]).reset_index(drop=True)
    return frame


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--out", default="analytics_exports", help="output directory (gitignored)")
    parser.add_argument("--env", default=".env", help="file with the PostHog settings")
    args = parser.parse_args()

    load_env(Path(args.env))
    api_key = os.environ.get("POSTHOG_PERSONAL_API_KEY")
    project_id = os.environ.get("POSTHOG_PROJECT_ID")
    host = os.environ.get("POSTHOG_APP_HOST", "https://eu.posthog.com")
    if not api_key or not project_id:
        print("Set POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID (environment or .env).", file=sys.stderr)
        return 2

    started = datetime.now(timezone.utc)
    rows = export_all(posthog_fetcher(host, project_id, api_key))
    frame = to_frame(rows)

    out_dir = Path(args.out) / started.strftime("%Y-%m-%d")
    out_dir.mkdir(parents=True, exist_ok=True)
    frame.to_parquet(out_dir / "events.parquet", index=False)
    manifest = {
        "exported_at": started.isoformat(),
        "host": host,
        "project_id": project_id,
        "query": QUERY,
        "min_schema_v": MIN_SCHEMA_V,
        "rows": int(len(frame)),
        "first_timestamp": frame["timestamp"].min().isoformat() if len(frame) else None,
        "last_timestamp": frame["timestamp"].max().isoformat() if len(frame) else None,
        "events": {k: int(v) for k, v in frame["event"].value_counts().items()} if len(frame) else {},
    }
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Exported {len(frame)} events to {out_dir}/events.parquet")
    return 0


if __name__ == "__main__":
    sys.exit(main())
