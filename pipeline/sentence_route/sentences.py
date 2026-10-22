import sys
from pathlib import Path

import pandas as pd

from pipeline.common.paths import CRAWL_DIR, REPO_ROOT
from pipeline.common.text import SEGMENTER, is_boilerplate, normalize_claim_text
from pipeline.crawl.crawler import load_result

MIN_WORDS = 2
CONTEXT_CHARS = 200
MAX_SENTENCES_PER_PAGE = 300
READABLE = ["ok", "partial"]


def split_sentences(text: str) -> list[str]:
    sentences = []
    for line in text.split("\n"):
        for piece in SEGMENTER.segment(line):
            piece = piece.strip()
            if piece not in ("", "."):
                sentences.append(piece)
    return sentences


def with_context(sentences: list[str]) -> list[tuple[str, str]]:
    pairs = []
    for i, sentence in enumerate(sentences):
        before = sentences[i - 1][-CONTEXT_CHARS:] if i > 0 else ""
        after = sentences[i + 1][:CONTEXT_CHARS] if i + 1 < len(sentences) else ""
        pairs.append((sentence, " ".join(part for part in (before, sentence, after) if part)))
    return pairs


def keep(sentence: str) -> bool:
    return len(sentence.split()) >= MIN_WORDS and not is_boilerplate(sentence)


def site_sentences(result: dict) -> list[dict]:
    pages = result["pages"][1:] + result["pages"][:1]
    seen = set()
    rows = []
    for page in pages:
        kept = 0
        for sentence, context in with_context(split_sentences(page["text"])):
            key = normalize_claim_text(sentence)
            if not keep(sentence) or not key or key in seen:
                continue
            if kept == MAX_SENTENCES_PER_PAGE:
                break
            kept += 1
            seen.add(key)
            rows.append(
                {
                    "domain": result["domain"],
                    "crawl_date": result["crawled_at"][:10],
                    "page_url": page["final_url"],
                    "sentence": sentence,
                    "context": context,
                }
            )
    return rows


def build_table(domains: list[str], folder: Path) -> pd.DataFrame:
    rows = []
    for domain in domains:
        path = folder / f"{domain}.json.gz"
        if path.exists():
            result = load_result(path)
            if result["status"] in READABLE:
                rows += site_sentences(result)
    return pd.DataFrame(rows)


if __name__ == "__main__":
    firms_csv = Path(sys.argv[1]) if len(sys.argv) > 1 else REPO_ROOT / "data/crawl/sample500.csv"
    folder = sorted(CRAWL_DIR.glob("20*"))[-1]
    table = build_table(pd.read_csv(firms_csv)["domain"].tolist(), folder)
    out = REPO_ROOT / f"data/sentences/{folder.name}.csv.gz"
    out.parent.mkdir(parents=True, exist_ok=True)
    table.to_csv(out, index=False)
    print(f"{len(table):,} sentences from {table['domain'].nunique()} sites -> {out.relative_to(REPO_ROOT)}")
