import json
import re
from datetime import datetime
from urllib.parse import quote, urlsplit, urlunsplit
from zoneinfo import ZoneInfo

import pandas as pd

from pipeline.common.cli import firms_json_parser
from pipeline.common.paths import EXPORT_DIR, REPO_ROOT
from pipeline.llm.claims import GROUP_A, GROUP_B

SCHEMA_VERSION = "1.1"
CRAWL_TIME_ZONE = ZoneInfo("Europe/Rome")
FIRMS_MASTER = EXPORT_DIR / "firms_master.csv"
CLAIMS_MASTER = EXPORT_DIR / "claims_master.csv"
FIRMS_JSON = EXPORT_DIR / "firms.json"
CATEGORIES = GROUP_A + GROUP_B
CRAWL_STATUS = {"ok": "ok", "partial": "partial", "thin": "partial"}
FIRM_COLUMNS = ["firm_id", "name", "website", "crawl_id", "crawled_at", "pages_crawled", "crawl_status"]
CLAIM_COLUMNS = [
    "firm_id",
    "claim_id",
    "crawl_id",
    "quote",
    "context_snippet",
    "source_url",
    "category",
    "scope_status",
    "confidence_level",
    "light",
    "reason_en",
    "reason_it",
]
FIRM_ID = re.compile(r"^[A-Za-z0-9_-]+$")
HTTP = re.compile(r"^https?://")


def local_time(naive: str) -> str:
    return datetime.fromisoformat(naive).replace(tzinfo=CRAWL_TIME_ZONE).isoformat(timespec="seconds")


def clean_url(url: str) -> str:
    parts = urlsplit(url.strip().replace("\\", "/"))
    host = parts.hostname.encode("idna").decode("ascii") if parts.hostname else ""
    netloc = host + (f":{parts.port}" if parts.port else "")
    safe = "/%:@!$&'()*+,;=~-._"
    return urlunsplit(
        (
            parts.scheme,
            netloc,
            quote(parts.path, safe),
            quote(parts.query, safe + "?"),
            quote(parts.fragment, safe + "?"),
        )
    )


def website_url(website: str, domain: str) -> str:
    site = (website or domain).strip()
    return clean_url(site if HTTP.match(site) else f"https://{site}")


def claim_record(claim: dict) -> dict:
    return {
        "claim_id": claim["claim_id"],
        "text": claim["quote"],
        "context_snippet": claim["context_snippet"],
        "source_url": clean_url(claim["source_url"]),
        "category": claim["category"],
        "scope_status": claim["scope_status"],
        "confidence": claim["confidence_level"],
        "gray_zone": None,
        "seen_in_crawls": [claim["crawl_id"]],
        "review": {"light": claim["light"], "en": {"reason": claim["reason_en"]}, "it": {"reason": claim["reason_it"]}},
    }


def firm_record(firm: dict, claims: list[dict]) -> dict:
    return {
        "firm_id": firm["firm_id"],
        "firm_name": firm["name"],
        "website": website_url(firm["website"], firm["domain"]),
        "crawls": [
            {
                "crawl_id": firm["crawl_id"],
                "crawled_at": local_time(firm["crawled_at"]),
                "pages_scraped": int(firm["pages_crawled"]),
                "status": CRAWL_STATUS.get(firm["crawl_status"], "failed"),
            }
        ],
        "claims": [claim_record(claim) for claim in claims],
    }


def build() -> dict:
    firms = pd.read_csv(FIRMS_MASTER, dtype=str, keep_default_na=False, usecols=[*FIRM_COLUMNS, "domain"])
    firms = firms[firms.firm_id != ""].sort_values("firm_id")
    claims = pd.read_csv(CLAIMS_MASTER, dtype=str, keep_default_na=False, usecols=CLAIM_COLUMNS)
    claims["order"] = claims.light.map({"red": 0, "yellow": 1})
    claims = claims.sort_values(["firm_id", "order", "claim_id"])
    by_firm = {firm_id: group.to_dict("records") for firm_id, group in claims.groupby("firm_id")}
    return {
        "schema_version": SCHEMA_VERSION,
        "generated_at": datetime.now(CRAWL_TIME_ZONE).isoformat(timespec="seconds"),
        "categories": CATEGORIES,
        "firms": [firm_record(firm, by_firm.get(firm["firm_id"], [])) for firm in firms.to_dict("records")],
    }


def problems(data: dict) -> list[str]:
    found = []
    categories = set(data["categories"])
    if len(categories) != len(data["categories"]):
        found.append("duplicate category")
    firm_ids = set()
    for firm in data["firms"]:
        firm_id = firm["firm_id"]
        if firm_id in firm_ids or not FIRM_ID.match(firm_id):
            found.append(f"{firm_id}: firm_id duplicate or not allowed")
        firm_ids.add(firm_id)
        if not firm["firm_name"] or not HTTP.match(firm["website"]) or not firm["crawls"]:
            found.append(f"{firm_id}: name, website or crawls missing")
        crawls = {crawl["crawl_id"]: crawl["status"] for crawl in firm["crawls"]}
        claim_ids = set()
        for claim in firm["claims"]:
            claim_id = claim["claim_id"]
            if claim_id in claim_ids or not claim_id.startswith(f"{firm_id}-"):
                found.append(f"{claim_id}: claim_id duplicate or without the firm prefix")
            claim_ids.add(claim_id)
            if claim["category"] not in categories:
                found.append(f"{claim_id}: unknown category {claim['category']}")
            if not claim["text"] or not HTTP.match(claim["source_url"]):
                found.append(f"{claim_id}: text or source_url missing")
            if claim["scope_status"] not in ("IN_SCOPE", "NEEDS_VERIFICATION"):
                found.append(f"{claim_id}: scope_status {claim['scope_status']}")
            if claim["confidence"] not in ("high", "medium", "low"):
                found.append(f"{claim_id}: confidence {claim['confidence']}")
            review = claim["review"]
            if review["light"] not in ("red", "yellow") or not review["en"]["reason"] or not review["it"]["reason"]:
                found.append(f"{claim_id}: light or reason missing")
            for crawl_id in claim["seen_in_crawls"]:
                if crawls.get(crawl_id, "failed") == "failed":
                    found.append(f"{claim_id}: seen in unknown or failed crawl {crawl_id}")
    return found


def main(argv: list[str] | None = None) -> None:
    args = firms_json_parser().parse_args(argv)
    data = build()
    issues = problems(data)
    if issues:
        print("\n".join(issues[:20]))
        raise SystemExit(f"{len(issues):,} problems; nothing written")
    output = args.output or FIRMS_JSON
    tmp = output.with_suffix(".tmp")
    with tmp.open("w") as handle:
        json.dump(data, handle, ensure_ascii=False, separators=(",", ":"))
    tmp.replace(output)
    claims = sum(len(firm["claims"]) for firm in data["firms"])
    size = output.stat().st_size / 1e6
    print(f"{len(data['firms']):,} firms, {claims:,} claims, schema {SCHEMA_VERSION}, {size:,.0f} MB, 0 problems")
    print(f"-> {output.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
