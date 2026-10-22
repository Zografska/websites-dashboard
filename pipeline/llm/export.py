import json

import pandas as pd

from pipeline.common.cli import export_parser
from pipeline.common.keywords import load_keywords, possible_misses
from pipeline.common.paths import CHUNK_DIR, FIRMS_CSV
from pipeline.common.text import normalize_claim_text
from pipeline.llm.b2c import B2C_DIR
from pipeline.llm.claims import CLAIMS_DIR

TRANSLATIONS_JSON = CLAIMS_DIR / "translations_en.json"
TYPE_ORDER = {"claim": 0, "llm unsure": 1, "possible miss": 2, "no claim": 3}
COLUMNS = [
    "name",
    "domain",
    "in_b2c_sector",
    "b2c",
    "b2c_evidence",
    "b2c_reason",
    "light",
    "type",
    "quote",
    "translation",
    "label",
    "category",
    "triggers",
    "gray_zone",
    "confidence",
    "reason",
    "why_flagged",
    "pages",
    "page_url",
    "context_snippet",
    "quote_found",
]


def load_translations() -> dict[str, str]:
    return json.loads(TRANSLATIONS_JSON.read_text()) if TRANSLATIONS_JSON.exists() else {}


def read_jsonl(path) -> list[dict]:
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def unsure_claims(record: dict) -> list[dict]:
    try:
        claims = json.loads(record.get("raw_answer") or "{}").get("claims", [])
    except json.JSONDecodeError:
        return []
    return [claim for claim in claims if isinstance(claim, dict) and claim.get("quote") and not claim.get("triggers")]


def item_rows(records: list[dict], chunks: dict, keywords) -> list[dict]:
    rows = []
    for record in records:
        unsure = unsure_claims(record)
        for claim in record["claims"]:
            rows.append({"type": "claim", "domain": record["domain"], "page_url": record["page_url"]} | claim)
        for claim in unsure:
            rows.append(
                {
                    "type": "llm unsure",
                    "domain": record["domain"],
                    "page_url": record["page_url"],
                    "quote": claim["quote"],
                    "confidence": claim.get("confidence"),
                    "reason": claim.get("reason"),
                }
            )
        text = chunks.get(record["key"])
        if text is None:
            continue
        quotes = [claim["quote"] for claim in record["claims"] + unsure]
        for miss in possible_misses(text, quotes, keywords):
            rows.append(
                {
                    "type": "possible miss",
                    "domain": record["domain"],
                    "page_url": record["page_url"],
                    "quote": miss["text"],
                    "why_flagged": f"{miss['why']}: {', '.join(miss['keywords'])}",
                }
            )
    return rows


def merge_duplicates(items: pd.DataFrame) -> pd.DataFrame:
    items["key"] = items["domain"] + "|" + items["quote"].map(normalize_claim_text)
    items["pages"] = items.groupby(["type", "key"])["page_url"].transform("nunique")
    items = items.drop_duplicates(["type", "key"])
    claimed = set(items.loc[items["type"] == "claim", "key"])
    return items[(items["type"] == "claim") | ~items["key"].isin(claimed)]


def main(argv: list[str] | None = None) -> None:
    args = export_parser().parse_args(argv)
    chunks_file = args.chunks or sorted(CHUNK_DIR.glob("20*.jsonl"))[-1]
    stem = chunks_file.stem
    sites = read_jsonl(chunks_file)
    domains = set(pd.read_csv(args.firms)["domain"]) if args.firms else {site["domain"] for site in sites}
    chunks = {
        f"{chunk['domain']}|{chunk['page_url']}|{chunk['chunk']}": chunk["text"]
        for site in sites
        if site["domain"] in domains
        for chunk in site["chunks"]
    }
    records = [r for r in read_jsonl(CLAIMS_DIR / args.model / f"{stem}.jsonl") if r["domain"] in domains]
    items = pd.DataFrame(item_rows(records, chunks, load_keywords()))
    items = merge_duplicates(items)
    items["triggers"] = items["triggers"].map(lambda t: ", ".join(t) if isinstance(t, list) else "")

    firms = pd.read_csv(FIRMS_CSV, usecols=["domain", "name", "in_b2c_sector"]).drop_duplicates("domain")
    b2c = pd.DataFrame(read_jsonl(B2C_DIR / args.model / f"{stem}.jsonl"))[["domain", "b2c", "evidence", "reason"]]
    b2c = b2c.rename(columns={"evidence": "b2c_evidence", "reason": "b2c_reason"})
    claims = items[items["type"] == "claim"]
    light = claims.groupby("domain")["label"].agg(lambda labels: "red" if "IN_SCOPE" in set(labels) else "yellow")

    read = sorted({site["domain"] for site in sites if site["domain"] in domains})
    no_claim = pd.DataFrame([{"domain": domain, "type": "no claim"} for domain in read if domain not in light.index])
    table = pd.concat([items, no_claim], ignore_index=True)
    table = table.merge(firms, on="domain", how="left").merge(b2c, on="domain", how="left")
    table["light"] = table["domain"].map(light).fillna("none")
    table["translation"] = table["quote"].map(load_translations()).fillna("")
    table["order"] = table["type"].map(TYPE_ORDER)
    table = table.sort_values(["name", "domain", "order", "label", "page_url"], na_position="last")
    output = CLAIMS_DIR / args.model / f"{stem}_review.csv"
    table[COLUMNS].to_csv(output, index=False)

    print(f"{output}: {len(table)} rows, {len(read)} firms")
    print(table["type"].value_counts().to_string())
    print(table.drop_duplicates("domain")["light"].value_counts().to_string())


if __name__ == "__main__":
    main()
