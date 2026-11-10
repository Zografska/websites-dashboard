import hashlib
import json
import re
from difflib import SequenceMatcher
from pathlib import Path

import pandas as pd

from pipeline.common.cli import review_sample_parser
from pipeline.common.text import normalize_claim_text
from pipeline.llm.claims import light_from
from pipeline.llm.export import load_translations

MAX_CLAIMS = 5
MAX_COMPARE = 3
MAX_MISSES = 2
MIN_MISS_WORDS = 3
SIMILAR = 0.75
BREADCRUMB = re.compile(r"[|»›>]")
WORD = re.compile(r"[^\W\d_]+")
COLUMNS = [
    "item_id",
    "name",
    "domain",
    "page_url",
    "type",
    "quote",
    "context_snippet",
    "translation",
    "label",
    "category",
    "triggers",
    "gray_zone",
    "confidence",
    "light",
    "reason",
    "why_flagged",
    "pages",
    "is_claim",
    "priority",
    "comment",
]
ANSWERS = ["is_claim", "priority", "comment"]


def item_id(domain: str, quote) -> str:
    if not isinstance(quote, str):
        return f"{domain}-firm"
    digest = hashlib.sha256(normalize_claim_text(quote).encode("utf-8")).hexdigest()[:6]
    return f"{domain}-{digest}"


def similar(a: str, b: str) -> bool:
    a, b = normalize_claim_text(a), normalize_claim_text(b)
    return bool(a and b) and (a in b or b in a or SequenceMatcher(None, a, b).ratio() > SIMILAR)


def covered(quote: str, others: list[str]) -> bool:
    return any(similar(quote, other) for other in others)


def compare_rows(path: Path, table: pd.DataFrame) -> pd.DataFrame:
    shown = table[table["type"].isin(["claim", "llm unsure"])].groupby("domain")["quote"].apply(list).to_dict()
    names = table.drop_duplicates("domain").set_index("domain")["name"].to_dict()
    rows, seen = [], set()
    for line in path.read_text().splitlines():
        if not line.strip():
            continue
        record = json.loads(line)
        domain = record["domain"]
        if domain not in names:
            continue
        for claim in record["claims"]:
            key = (domain, normalize_claim_text(claim["quote"]))
            if key in seen or covered(claim["quote"], shown.get(domain, [])):
                continue
            seen.add(key)
            rows.append(
                {
                    "type": "v1 only",
                    "name": names[domain],
                    "domain": domain,
                    "page_url": record["page_url"],
                    "b2c": table.loc[table["domain"] == domain, "b2c"].iloc[0],
                    "quote": claim["quote"],
                    "context_snippet": claim.get("context_snippet", ""),
                    "label": claim["label"],
                    "category": claim["category"],
                    "triggers": ", ".join(claim["triggers"]),
                    "gray_zone": claim.get("gray_zone"),
                    "confidence": claim["confidence"],
                    "reason": claim["reason"],
                    "pages": 1,
                }
            )
    return pd.DataFrame(rows)


def keep_miss(quote: str, compared: list[str]) -> bool:
    return len(WORD.findall(quote)) >= MIN_MISS_WORDS and not BREADCRUMB.search(quote) and not covered(quote, compared)


def firm_rows(items: pd.DataFrame, seed: int) -> pd.DataFrame:
    def pick(kind: str, cap: int) -> pd.DataFrame:
        rows = items[items["type"] == kind]
        return rows.sample(min(len(rows), cap), random_state=seed)

    compared = items.loc[items["type"] == "v1 only", "quote"].tolist()
    misses = items[items["type"] == "possible miss"]
    misses = misses[[keep_miss(quote, compared) for quote in misses["quote"]]]
    rows = pd.concat(
        [
            pick("claim", MAX_CLAIMS),
            pick("v1 only", MAX_COMPARE),
            items[items["type"] == "llm unsure"],
            misses.sample(min(len(misses), MAX_MISSES), random_state=seed),
        ]
    )
    return rows.sample(frac=1, random_state=seed)


def take_firms(groups: list[pd.DataFrame], target: int) -> tuple[list[pd.DataFrame], list[pd.DataFrame]]:
    taken, total = [], 0
    while groups and total < target:
        group = groups.pop(0)
        taken.append(group)
        total += len(group)
    return taken, groups


def main(argv: list[str] | None = None) -> None:
    args = review_sample_parser().parse_args(argv)
    reviewers = args.reviewers.split(",")
    table = pd.read_csv(args.table)
    if args.compare:
        table = pd.concat([table, compare_rows(args.compare, table)], ignore_index=True)
        translations = load_translations()
        table["translation"] = table["translation"].fillna(table["quote"].map(translations)).fillna("")
    table["item_id"] = [item_id(d, q) for d, q in zip(table["domain"], table["quote"], strict=True)]
    table["light"] = [
        light_from(label, category) if kind in ("claim", "v1 only") else ""
        for kind, label, category in zip(table["type"], table["label"], table["category"], strict=True)
    ]
    in_scope = table["b2c"].isin(args.b2c.split(","))
    found = table["type"].isin(["claim", "v1 only"]) & in_scope
    firms = table.loc[found, "domain"].drop_duplicates().sample(frac=1, random_state=args.seed).tolist()
    groups = [firm_rows(table[table["domain"] == firm], args.seed) for firm in firms]

    shared, groups = take_firms(groups, args.shared_rows)
    assigned = {}
    for reviewer in reviewers:
        assigned[reviewer], groups = take_firms(groups, args.rows)

    no_claim = table[table["type"] == "no claim"].sample(
        min(args.no_claim_firms, int((table["type"] == "no claim").sum())), random_state=args.seed
    )
    split = [no_claim.iloc[index :: len(reviewers)] for index in range(len(reviewers))]

    output_dir = args.table.parent
    for index, reviewer in enumerate(reviewers):
        sheet = pd.concat([*shared, *assigned[reviewer], split[index]], ignore_index=True)
        sheet["order"] = range(len(sheet))
        sheet = sheet.sort_values(["name", "domain", "order"], na_position="last")
        for column in ANSWERS:
            sheet[column] = ""
        path = output_dir / f"{args.table.stem}_sample_{reviewer.lower()}.csv"
        sheet[COLUMNS].to_csv(path, index=False)
        firm_count = sheet["domain"].nunique()
        print(f"{path}: {len(sheet)} rows, {firm_count} firms | {sheet['type'].value_counts().to_dict()}")
    print(f"shared: {sum(len(g) for g in shared)} rows, {len(shared)} firms")
    print(f"firms left unused: {len(groups)}")
