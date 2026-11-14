"""Offline tests for the engagement export and indicators: python3 -m pytest scripts/test_engagement.py"""
import pandas as pd
import pytest

from engagement_indicators import compute
from export_engagement import export_all, to_frame


def ev(uuid, ts, event, subject="S1", visit="v1", **props):
    return {"uuid": uuid, "timestamp": pd.Timestamp(ts, tz="UTC"), "event": event, "subject_id": subject, "visit_id": visit, "is_test": False, **props}


MAPPING = pd.DataFrame(
    [
        {"subject_id": "S1", "firm_id": "F001", "sent_at": "2026-12-01", "n_claims": 4},
        {"subject_id": "S2", "firm_id": "F002", "sent_at": "2026-12-01", "n_claims": 0},
        {"subject_id": "S3", "firm_id": "F003", "sent_at": "2026-12-01", "n_claims": 2},
    ]
)


def test_indicators():
    events = pd.DataFrame(
        [
            ev("1", "2026-12-02T09:00:00", "visit_started"),
            ev("2", "2026-12-02T09:00:01", "tab_viewed", tab="overview", trigger="initial"),
            ev("3", "2026-12-02T09:00:20", "tab_viewed", tab="claims", trigger="click"),
            ev("4", "2026-12-02T09:00:30", "claim_opened", claim="aaaaaa"),
            ev("5", "2026-12-02T09:00:40", "claim_opened", claim="aaaaaa"),
            ev("6", "2026-12-02T09:00:50", "claim_opened", claim="bbbbbb"),
            ev("7", "2026-12-02T09:01:00", "source_clicked", claim="bbbbbb"),
            ev("8", "2026-12-02T09:01:10", "heartbeat", active_ms=15000),
            ev("9", "2026-12-02T09:01:25", "heartbeat", active_ms=15000),
            # 20 minutes later: same session. Then 23:30 Rome time on the 2nd is still the same day.
            ev("10", "2026-12-02T09:21:00", "visit_started", visit="v2"),
            ev("11", "2026-12-02T22:30:00", "visit_started", visit="v3"),
            ev("12", "2026-12-02T23:30:00", "visit_started", visit="v4"),  # 00:30 on the 3rd in Rome
            ev("13", "2026-12-02T23:30:05", "methodology_viewed", visit="v4"),
            ev("13", "2026-12-02T23:30:05", "methodology_viewed", visit="v4"),  # duplicate uuid
            # Ignored: a test subject, and a subject_id that isn't in the mapping.
            {**ev("14", "2026-12-02T10:00:00", "visit_started", subject="S3", visit="t1"), "is_test": True},
            ev("15", "2026-12-02T10:00:00", "visit_started", subject="FAKE", visit="x1"),
            # S2 opened and did nothing.
            ev("16", "2026-12-05T08:00:00", "visit_started", subject="S2", visit="w1"),
            ev("17", "2026-12-05T08:00:01", "tab_viewed", subject="S2", visit="w1", tab="overview", trigger="initial"),
            ev("18", "2026-12-05T08:00:16", "heartbeat", subject="S2", visit="w1", active_ms=15000),
        ]
    )
    out = compute(events, MAPPING).set_index("subject_id")

    s1 = out.loc["S1"]
    assert s1["opened"] and not s1["opened_no_interaction"]
    assert s1["days_to_first_open"] == pytest.approx(1 + 10 / 24, abs=1e-3)  # sent 00:00 Rome = 23:00 UTC
    assert s1["n_sessions"] == 3
    assert s1["n_active_days"] == 2
    assert s1["tabs_viewed"] == 2
    assert s1["claims_opened_share"] == 0.5
    assert s1["active_minutes"] == 0.5
    assert s1["source_clicks"] == 1
    assert s1["methodology_viewed"]
    assert s1["last_seen"].startswith("2026-12-02T23:30:05")

    s2 = out.loc["S2"]
    assert s2["opened"] and s2["opened_no_interaction"]
    assert pd.isna(s2["claims_opened_share"])

    s3 = out.loc["S3"]
    assert not s3["opened"] and s3["n_sessions"] == 0 and pd.isna(s3["days_to_first_open"])
    assert "FAKE" not in out.index


def test_paging_dedupes_the_boundary_timestamp():
    data = [(f"u{i}", f"2026-12-02 09:00:{i // 2:02d}", "heartbeat", {}) for i in range(7)]
    calls = []

    def fetch(after):
        calls.append(after)
        return [r for r in data if r[1] >= after][:3]

    rows = export_all(fetch, page_size=3)
    assert [r[0] for r in rows] == [f"u{i}" for i in range(7)]
    assert calls[0] == "1970-01-01 00:00:00" and len(calls) == 4


def test_paging_refuses_to_loop():
    page = [(f"u{i}", "2026-12-02 09:00:00", "heartbeat", {}) for i in range(3)]
    with pytest.raises(RuntimeError):
        export_all(lambda after: page, page_size=3)


def test_frame_keeps_only_our_properties():
    frame = to_frame([("u1", "2026-12-02T09:00:00.123456Z", "tab_viewed", {"tab": "claims", "subject_id": "S1", "$lib": "web", "token": "phc_x", "distinct_id": "v1"})])
    assert list(frame.columns) == ["uuid", "timestamp", "event", "tab", "subject_id"]
    assert str(frame["timestamp"].dt.tz) == "UTC"
