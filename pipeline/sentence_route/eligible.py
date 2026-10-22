import sys
from pathlib import Path

import pandas as pd

from pipeline.common.paths import CRAWL_DIR, REPO_ROOT
from pipeline.crawl.crawler import load_result

FIRM_COLUMNS = ["bvd_id", "name", "domain", "sector", "size_class", "region"]
EXAMPLES = 3


def crawl_statuses(domains: list[str], folder: Path) -> pd.Series:
    statuses = {}
    for domain in domains:
        path = folder / f"{domain}.json.gz"
        statuses[domain] = load_result(path)["status"] if path.exists() else "not crawled"
    return pd.Series(statuses, name="crawl_status")


def firm_matches(candidates: pd.DataFrame) -> pd.DataFrame:
    candidates = candidates.assign(n_keywords=candidates["keywords"].str.split("; ").map(len))
    ranked = candidates.sort_values("n_keywords", ascending=False)
    return ranked.groupby("domain").agg(
        matched_sentences=("sentence", "size"),
        strong_sentences=("n_keywords", lambda n: int((n >= 2).sum())),
        keywords=("keywords", lambda k: "; ".join(sorted({w for row in k for w in row.split("; ")}))),
        example_sentences=("sentence", lambda s: " | ".join(s.head(EXAMPLES))),
    )


def build_firm_table(firms: pd.DataFrame, candidates: pd.DataFrame, folder: Path) -> pd.DataFrame:
    table = firms[FIRM_COLUMNS].set_index("domain")
    table = table.join(crawl_statuses(table.index.tolist(), folder)).join(firm_matches(candidates))
    table[["matched_sentences", "strong_sentences"]] = (
        table[["matched_sentences", "strong_sentences"]].fillna(0).astype(int)
    )
    table[["keywords", "example_sentences"]] = table[["keywords", "example_sentences"]].fillna("")
    table["eligible_1kw"] = table["matched_sentences"] >= 1
    table["eligible_2kw"] = table["strong_sentences"] >= 1
    return table.reset_index()[FIRM_COLUMNS[:2] + ["domain"] + FIRM_COLUMNS[3:] + list(table.columns[5:])]


if __name__ == "__main__":
    firms_csv = Path(sys.argv[1]) if len(sys.argv) > 1 else REPO_ROOT / "data/crawl/sample500.csv"
    folder = sorted(CRAWL_DIR.glob("20*"))[-1]
    candidates = pd.read_csv(REPO_ROOT / "data/candidates" / f"{folder.name}.csv.gz")
    table = build_firm_table(pd.read_csv(firms_csv), candidates, folder)
    out = REPO_ROOT / "data/eligible_firms.csv"
    table.to_csv(out, index=False)
    print(f"{len(table)} firms -> {out.relative_to(REPO_ROOT)}")
    print(table["crawl_status"].value_counts().to_string())
    print(f"eligible, at least 1 keyword sentence: {table['eligible_1kw'].sum()}")
    print(f"eligible, at least 1 sentence with 2+ keywords: {table['eligible_2kw'].sum()}")
