import hashlib
import re

import numpy as np
import pandas as pd

from pipeline.common.cli import ids_parser
from pipeline.common.paths import EXPORT_DIR, REPO_ROOT
from pipeline.common.text import normalize_claim_text

FIRMS_MASTER = EXPORT_DIR / "firms_master.csv"
FIRM_IDS_CSV = EXPORT_DIR / "firm_ids.csv"
FIRM_ID_DIGITS = 5

FIRM_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]+$")
CLAIM_HASH_LENGTH = 6
LONG_CLAIM_HASH_LENGTH = 8


def text_hash(text: str, length: int = CLAIM_HASH_LENGTH) -> str:
    return hashlib.sha256(normalize_claim_text(text).encode("utf-8")).hexdigest()[:length]


def claim_id(firm_id: str, text: str, length: int = CLAIM_HASH_LENGTH) -> str:
    return f"{firm_id}-{text_hash(text, length)}"


def crawl_id(firm_id: str, number: int = 1) -> str:
    return f"{firm_id}-C{number:02d}"


def claim_ids(firm_id: str, texts: list[str]) -> list[str]:
    keys = [normalize_claim_text(text) for text in texts]
    short = {key: text_hash(key) for key in set(keys)}
    length = CLAIM_HASH_LENGTH if len(set(short.values())) == len(short) else LONG_CLAIM_HASH_LENGTH
    ids = [claim_id(firm_id, key, length) for key in keys]
    distinct = {key: identifier for key, identifier in zip(keys, ids, strict=True)}
    if len(set(distinct.values())) != len(distinct):
        raise ValueError(f"claim id collision within {firm_id} even with {length} characters")
    return ids


def firm_id(number: int) -> str:
    return f"F{number:0{FIRM_ID_DIGITS}d}"


def firms_with_claims() -> pd.DataFrame:
    firms = pd.read_csv(FIRMS_MASTER, usecols=["bvd_id", "domain", "has_claims"], dtype={"bvd_id": str})
    return firms[firms.has_claims].drop(columns="has_claims").sort_values("bvd_id").reset_index(drop=True)


def new_ids(firms: pd.DataFrame, start: int, seed: int) -> pd.DataFrame:
    order = np.random.default_rng(seed).permutation(len(firms))
    numbered = firms.iloc[order].reset_index(drop=True)
    numbered.insert(0, "firm_id", [firm_id(start + position) for position in range(len(numbered))])
    return numbered.assign(seed=seed)


def check(table: pd.DataFrame) -> None:
    problems = []
    if not table.firm_id.is_unique:
        problems.append("firm_id not unique")
    if not table.bvd_id.is_unique:
        problems.append("bvd_id not unique")
    if not table.firm_id.map(lambda value: bool(FIRM_ID_PATTERN.match(value))).all():
        problems.append("firm_id with characters the dashboard does not allow")
    if problems:
        raise SystemExit("; ".join(problems))


def main(argv: list[str] | None = None) -> None:
    args = ids_parser().parse_args(argv)
    firms = firms_with_claims()
    if FIRM_IDS_CSV.exists():
        table = pd.read_csv(FIRM_IDS_CSV, dtype={"bvd_id": str})
        fresh = firms[~firms.bvd_id.isin(table.bvd_id)]
        start = int(table.firm_id.str[1:].astype(int).max()) + 1
        gone = int((~table.bvd_id.isin(firms.bvd_id)).sum())
        print(f"{len(table):,} firm ids kept as they are; {gone:,} of them have no claims in this run (kept)")
    else:
        table, fresh, start = pd.DataFrame(columns=["firm_id", "bvd_id", "domain", "seed"]), firms, 1
    if len(fresh):
        table = pd.concat([table, new_ids(fresh, start, args.seed)], ignore_index=True)
    check(table)
    table.to_csv(FIRM_IDS_CSV, index=False)
    print(f"{len(fresh):,} new firm ids ({firm_id(start)} onwards, seed {args.seed}); {len(table):,} in total")
    print(f"-> {FIRM_IDS_CSV.relative_to(REPO_ROOT)}")


if __name__ == "__main__":
    main()
