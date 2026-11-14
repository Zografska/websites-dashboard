#!/usr/bin/env python3
"""Compute the per-firm engagement indicators (ANALYTICS_SPEC §8) from an event export.

Usage:
    python3 scripts/engagement_indicators.py --events analytics_exports/<date>/events.parquet \\
        --mapping <offline mapping.csv> --out <indicators.csv>

The mapping is the offline table that links subject_id to the firm. Run this only on the
approved storage: it is the one place where events and firm identities meet. Columns:
    subject_id   pseudonymous ID sent with the events
    firm_id      the real firm ID (copied to the output)
    sent_at      date or datetime the link was sent (ISO 8601; no timezone means Europe/Rome)
    n_claims     number of claims in the firm's report

Events whose subject_id isn't in the mapping (fake events sent with the public key) and events
flagged is_test are ignored. Every mapped firm gets a row, also those that never opened the link.
Requires: pandas, pyarrow.
"""
from __future__ import annotations

import argparse
import sys

import pandas as pd

ROME = "Europe/Rome"
SESSION_GAP = pd.Timedelta(minutes=30)
# Events that don't count as interaction: they happen just by opening the page and leaving it there.
PASSIVE = {"visit_started", "visit_ended", "heartbeat", "consent_granted", "consent_changed"}


def _is_passive(row) -> bool:
    return row["event"] in PASSIVE or (row["event"] == "tab_viewed" and row.get("trigger") == "initial")


def _n_sessions(events: pd.DataFrame) -> int:
    """Visits merged when the gap between one's last event and the next one's first is under 30 min."""
    spans = events.groupby("visit_id")["timestamp"].agg(["min", "max"]).sort_values("min")
    sessions, last_end = 0, None
    for start, end in spans.itertuples(index=False):
        if last_end is None or start - last_end >= SESSION_GAP:
            sessions += 1
            last_end = end
        else:
            last_end = max(last_end, end)
    return sessions


def _to_utc(value) -> pd.Timestamp:
    ts = pd.Timestamp(value)
    return (ts.tz_localize(ROME) if ts.tzinfo is None else ts).tz_convert("UTC")


def compute(events: pd.DataFrame, mapping: pd.DataFrame) -> pd.DataFrame:
    events = events.drop_duplicates("uuid") if "uuid" in events else events
    for column in ("is_test", "claim", "tab", "trigger", "active_ms", "visit_id"):
        if column not in events:
            events = events.assign(**{column: None})
    events = events[events["is_test"] != True]  # noqa: E712 (missing values count as not-test)
    events = events[events["subject_id"].isin(mapping["subject_id"])]
    by_subject = {sid: g.sort_values("timestamp") for sid, g in events.groupby("subject_id")}

    rows = []
    for m in mapping.itertuples(index=False):
        g = by_subject.get(m.subject_id)
        row = {
            "subject_id": m.subject_id,
            "firm_id": m.firm_id,
            "opened": False,
            "days_to_first_open": None,
            "n_sessions": 0,
            "n_active_days": 0,
            "tabs_viewed": 0,
            "claims_opened_share": 0.0 if m.n_claims else None,
            "active_minutes": 0.0,
            "source_clicks": 0,
            "methodology_viewed": False,
            "opened_no_interaction": False,
            "last_seen": None,
        }
        starts = g[g["event"] == "visit_started"] if g is not None else None
        if g is not None and len(starts) > 0:
            first_open = starts["timestamp"].iloc[0]
            claims_opened = g.loc[g["event"] == "claim_opened", "claim"].nunique()
            row.update(
                opened=True,
                days_to_first_open=round((first_open - _to_utc(m.sent_at)) / pd.Timedelta(days=1), 3),
                n_sessions=_n_sessions(g),
                n_active_days=starts["timestamp"].dt.tz_convert(ROME).dt.date.nunique(),
                tabs_viewed=g.loc[g["event"] == "tab_viewed", "tab"].nunique(),
                claims_opened_share=round(claims_opened / m.n_claims, 4) if m.n_claims else None,
                active_minutes=round(float(g.loc[g["event"] == "heartbeat", "active_ms"].sum()) / 60_000, 3),
                source_clicks=int((g["event"] == "source_clicked").sum()),
                methodology_viewed=bool((g["event"] == "methodology_viewed").any()),
                opened_no_interaction=bool(g.apply(_is_passive, axis=1).all()),
                last_seen=g["timestamp"].max().isoformat(),
            )
        rows.append(row)
    return pd.DataFrame(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--events", required=True)
    parser.add_argument("--mapping", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    events = pd.read_parquet(args.events)
    mapping = pd.read_csv(args.mapping, dtype={"subject_id": str, "firm_id": str})
    missing = {"subject_id", "firm_id", "sent_at", "n_claims"} - set(mapping.columns)
    if missing:
        print(f"mapping is missing columns: {', '.join(sorted(missing))}", file=sys.stderr)
        return 2
    unknown = events.loc[~events["subject_id"].isin(mapping["subject_id"]), "subject_id"].nunique() if len(events) else 0
    result = compute(events, mapping)
    result.to_csv(args.out, index=False)
    print(f"{len(result)} firms, {int(result['opened'].sum())} opened; ignored {unknown} unknown subject_id(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
