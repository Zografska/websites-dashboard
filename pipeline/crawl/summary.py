import sys
from pathlib import Path

import pandas as pd

from pipeline.common.paths import CRAWL_DIR, REPO_ROOT
from pipeline.crawl.crawler import FALLBACK_USER_AGENT, load_result

READABLE = ["ok", "partial"]


def summarize_site(path: Path) -> dict:
    result = load_result(path)
    return {
        "domain": result["domain"],
        "status": result["status"],
        "reason": "some subpages failed" if result["status"] == "partial" else result["reason"],
        "seconds": result["seconds"],
        "kb": round(path.stat().st_size / 1000, 1),
        "pages": len(result["pages"]),
        "chars": sum(len(page["text"]) for page in result["pages"]),
        "off": result["off_domain"],
        "fallback": result["user_agent"] == FALLBACK_USER_AGENT,
        "robots": result["robots_found"],
        "disallowed": any(page["robots_disallowed"] for page in result["pages"]),
    }


def build_summary(firms: pd.DataFrame, folder: Path) -> pd.DataFrame:
    paths = [folder / f"{domain}.json.gz" for domain in firms["domain"]]
    rows = [summarize_site(path) for path in paths if path.exists()]
    summary = pd.DataFrame(rows).merge(firms[["domain", "sector", "size_class"]], on="domain", how="left")
    return summary.assign(readable=summary["status"].isin(READABLE))


def share_table(summary: pd.DataFrame, column: str) -> pd.DataFrame:
    counts = summary[column].value_counts()
    return pd.DataFrame({"sites": counts, "pct": (100 * counts / len(summary)).round(1)})


def print_report(summary: pd.DataFrame, total_firms: int) -> None:
    readable = summary[summary["readable"]]
    problems = summary[~summary["readable"]]
    print(f"sites: {len(summary)}\n")
    print(share_table(summary, "status").to_string(), "\n")
    print(problems.groupby(["status", "reason"]).size().sort_values(ascending=False).to_string(), "\n")
    share = summary["readable"].mean()
    print(f"readable: {len(readable)} ({share:.1%}), ~{share * total_firms:,.0f} of {total_firms:,} firms")
    print(
        f"pages per readable site: mean {readable['pages'].mean():.1f}, homepage only {(readable['pages'] == 1).sum()}"
    )
    print(
        f"characters per readable site: median {readable['chars'].median():,.0f}, mean {readable['chars'].mean():,.0f}"
    )
    print(f"seconds per site: mean {summary['seconds'].mean():.1f}, median {summary['seconds'].median():.1f}")
    print(f"kb per site: mean {summary['kb'].mean():.0f}, full run ~{summary['kb'].mean() * total_firms / 1e6:.1f} GB")
    flags = {
        "off-domain": "off",
        "fallback user agent": "fallback",
        "robots.txt found": "robots",
        "robots disallowed": "disallowed",
    }
    print(", ".join(f"{label} {summary[column].sum()}" for label, column in flags.items()), "\n")
    print(summary.groupby("size_class")["readable"].agg(["sum", "count", "mean"]).round(2).to_string(), "\n")
    print(
        summary.groupby("sector")["readable"]
        .agg(["sum", "count", "mean"])
        .sort_values("count", ascending=False)
        .round(2)
        .to_string()
    )


if __name__ == "__main__":
    firms_csv = Path(sys.argv[1]) if len(sys.argv) > 1 else REPO_ROOT / "data/crawl/sample500.csv"
    folder = Path(sys.argv[2]) if len(sys.argv) > 2 else sorted(CRAWL_DIR.glob("20*"))[-1]
    firms = pd.read_csv(firms_csv)
    total_firms = len(pd.read_csv(REPO_ROOT / "data/firms_filtered.csv", usecols=["domain"]))
    summary = build_summary(firms, folder)
    summary.to_csv(firms_csv.with_name(firms_csv.stem.replace("sample", "summary") + ".csv"), index=False)
    print_report(summary, total_firms)
