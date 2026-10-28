import hashlib

import pandas as pd

from pipeline.common.cli import review_sample_parser
from pipeline.common.text import normalize_claim_text

MAX_CLAIMS = 10
MAX_MISSES = 3
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
    "reason",
    "is_claim",
    "label_ok",
    "priority",
    "comment",
]


def item_id(domain: str, quote) -> str:
    if not isinstance(quote, str):
        return f"{domain}-firm"
    digest = hashlib.sha256(normalize_claim_text(quote).encode("utf-8")).hexdigest()[:6]
    return f"{domain}-{digest}"


def firm_rows(items: pd.DataFrame, seed: int) -> pd.DataFrame:
    claims = items[items["type"] == "claim"]
    claims = claims.sample(min(len(claims), MAX_CLAIMS), random_state=seed)
    misses = items[items["type"] == "possible miss"]
    misses = misses.sample(min(len(misses), MAX_MISSES), random_state=seed)
    return pd.concat([claims, items[items["type"] == "llm unsure"], misses])


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
    table["item_id"] = [item_id(d, q) for d, q in zip(table["domain"], table["quote"], strict=True)]
    in_scope = table["b2c"].isin(args.b2c.split(","))
    with_claims = table.loc[(table["type"] == "claim") & in_scope, "domain"].drop_duplicates()
    firms = with_claims.sample(frac=1, random_state=args.seed).tolist()
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
        sheet = sheet.sort_values(["name", "domain", "type", "page_url"], na_position="last")
        for column in ("is_claim", "label_ok", "priority", "comment"):
            sheet[column] = ""
        path = output_dir / f"{args.table.stem}_sample_{reviewer.lower()}.csv"
        sheet[COLUMNS].to_csv(path, index=False)
        firm_count = sheet["domain"].nunique()
        print(f"{path}: {len(sheet)} rows, {firm_count} firms | {sheet['type'].value_counts().to_dict()}")
    print(f"shared: {sum(len(g) for g in shared)} rows, {len(shared)} firms")
