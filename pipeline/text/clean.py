import gzip
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

import ftfy
import pandas as pd

from pipeline.common.cli import clean_args
from pipeline.common.paths import CLEAN_DIR, CRAWL_DIR, REPO_ROOT
from pipeline.common.text import is_boilerplate
from pipeline.crawl.crawler import load_result

READABLE = ("ok", "partial")
MAX_BOILERPLATE_BLOCK_CHARS = 400


def fix_text(text: str) -> list[str]:
    text = unicodedata.normalize("NFKC", ftfy.fix_text(text, uncurl_quotes=False))
    return [re.sub(r"[ \t]+", " ", line).strip() for line in text.splitlines() if line.strip()]


def block_key(block: str) -> str:
    return re.sub(r"\W+", " ", block.lower()).strip()


def repeated_blocks(pages: list[list[str]]) -> set[str]:
    if len(pages) < 2:
        return set()
    seen_on = Counter(key for blocks in pages for key in {block_key(b) for b in blocks})
    return {key for key, n in seen_on.items() if key and n >= max(2, len(pages) / 2)}


def broken_lines(blocks: list[str]) -> int:
    return sum(
        1
        for line, following in zip(blocks, blocks[1:], strict=False)
        if not re.search(r"[.!?:;»\")]$", line) and following[:1].islower()
    )


def clean_site(result: dict) -> dict:
    pages = [fix_text(page["text"]) for page in result["pages"]]
    repeated = repeated_blocks(pages)
    kept_once, cleaned = set(), []
    for page, blocks in zip(result["pages"], pages, strict=True):
        out = []
        for block in blocks:
            key = block_key(block)
            if key in repeated and key in kept_once:
                continue
            if len(block) <= MAX_BOILERPLATE_BLOCK_CHARS and is_boilerplate(block):
                continue
            kept_once.add(key)
            out.append(block)
        cleaned.append(
            {
                "url": page["final_url"],
                "chosen_because": page["chosen_because"],
                "chars_before": len(page["text"]),
                "chars_after": sum(len(b) for b in out),
                "broken_lines_before": broken_lines(page["text"].splitlines()),
                "broken_lines_after": broken_lines(out),
                "text": "\n".join(out),
            }
        )
    return {"domain": result["domain"], "crawled_at": result["crawled_at"], "pages": cleaned}


def save_clean(site: dict, folder: Path) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    path = folder / f"{site['domain']}.json.gz"
    with gzip.open(path, "wt", encoding="utf-8") as file:
        json.dump(site, file, ensure_ascii=False)
    return path


if __name__ == "__main__":
    args = clean_args()
    folder = args.folder or sorted(CRAWL_DIR.glob("20*"))[-1]
    domains = pd.read_csv(args.firms)["domain"].tolist() if args.firms else None
    paths = [folder / f"{d}.json.gz" for d in domains] if domains else sorted(folder.glob("*.json.gz"))
    out_folder = CLEAN_DIR / folder.name
    rows = []
    for path in paths:
        if not path.exists():
            continue
        result = load_result(path)
        if result["status"] not in READABLE:
            continue
        site = clean_site(result)
        save_clean(site, out_folder)
        for page in site["pages"]:
            rows.append({"domain": site["domain"], **{k: v for k, v in page.items() if k != "text"}})
    stats = pd.DataFrame(rows)
    stats.to_csv(out_folder / "_clean_stats.csv", index=False)
    print(f"{stats['domain'].nunique()} sites, {len(stats)} pages -> {out_folder.relative_to(REPO_ROOT)}")
    before, after = stats["chars_before"].sum(), stats["chars_after"].sum()
    print(f"characters: {before:,} -> {after:,} ({after / before:.0%} kept)")
    print(f"broken lines: {stats['broken_lines_before'].sum():,} -> {stats['broken_lines_after'].sum():,}")
