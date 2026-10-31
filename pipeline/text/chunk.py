import gzip
import json
import math
from pathlib import Path

import pandas as pd

from pipeline.common.cli import chunk_parser
from pipeline.common.paths import CHUNK_DIR, CLEAN_DIR, REPO_ROOT
from pipeline.common.text import SEGMENTER

CHARS_PER_TOKEN = 4.07
CHUNK_TOKENS = 3000
OVERLAP_TOKENS = 200
OVERLAP_BLOCKS = 2
MAX_CHUNKS_PER_SITE = 8
MIN_CHUNK_TOKENS = 20


def tokens(text: str) -> int:
    return math.ceil(len(text) / CHARS_PER_TOKEN)


def split_words(text: str) -> list[str]:
    pieces, current = [], ""
    for word in text.split(" "):
        if current and tokens(current + " " + word) > CHUNK_TOKENS:
            pieces.append(current)
            current = word
        else:
            current = f"{current} {word}".strip()
    return pieces + [current] if current else pieces


def split_big_block(block: str) -> list[str]:
    if tokens(block) <= CHUNK_TOKENS:
        return [block]
    parts = []
    for sentence in SEGMENTER.segment(block):
        parts += split_words(sentence) if tokens(sentence) > CHUNK_TOKENS else [sentence.strip()]
    return [part for part in parts if part]


def page_blocks(text: str) -> list[tuple[int, str]]:
    return [(number, piece) for number, block in enumerate(text.splitlines()) for piece in split_big_block(block)]


def overlap(chunk: list[tuple[int, str]]) -> list[tuple[int, str]]:
    tail = chunk[-OVERLAP_BLOCKS:]
    while tail and sum(tokens(block) for _, block in tail) > OVERLAP_TOKENS:
        tail = tail[1:]
    return tail


def page_chunks(text: str) -> list[list[tuple[int, str]]]:
    chunks, current, size = [], [], 0
    for number, block in page_blocks(text):
        cost = tokens(block)
        if current and size + cost > CHUNK_TOKENS:
            chunks.append(current)
            current = overlap(current)
            size = sum(tokens(b) for _, b in current)
        current.append((number, block))
        size += cost
    return chunks + [current] if current else chunks


# TODO: small pages of the same site are sent one call each. Merging them into one call (each labelled with its
# address, total under CHUNK_TOKENS) would cut the number of calls; the LLM would then have to say which page
# each claim comes from. Decided against for now (21 Oct); revisit if call overhead matters.
def site_chunks(site: dict) -> dict:
    chunks = []
    for page in site["pages"]:
        page_parts = page_chunks(page["text"])
        for index, part in enumerate(page_parts, 1):
            text = "\n".join(block for _, block in part)
            chunks.append(
                {
                    "domain": site["domain"],
                    "page_url": page["url"],
                    "chunk": index,
                    "of": len(page_parts),
                    "blocks": [part[0][0], part[-1][0]],
                    "tokens_est": tokens(text),
                    "text": text,
                }
            )
    chunks = [chunk for chunk in chunks if chunk["tokens_est"] >= MIN_CHUNK_TOKENS]
    kept, dropped = chunks[:MAX_CHUNKS_PER_SITE], chunks[MAX_CHUNKS_PER_SITE:]
    return {
        "domain": site["domain"],
        "crawled_at": site["crawled_at"],
        "truncated": bool(dropped),
        "dropped_chunks": len(dropped),
        "dropped_tokens_est": sum(chunk["tokens_est"] for chunk in dropped),
        "chunks": kept,
    }


def load_clean(path: Path) -> dict:
    with gzip.open(path, "rt", encoding="utf-8") as file:
        return json.load(file)


def main(argv: list[str] | None = None) -> None:
    args = chunk_parser().parse_args(argv)
    folder = args.folder or sorted(CLEAN_DIR.glob("20*"))[-1]
    domains = pd.read_csv(args.firms)["domain"].tolist() if args.firms else None
    paths = [folder / f"{d}.json.gz" for d in domains] if domains else sorted(folder.glob("*.json.gz"))
    out = CHUNK_DIR / f"{folder.name}.jsonl"
    out.parent.mkdir(parents=True, exist_ok=True)
    rows = []
    with out.open("w") as file:
        for path in paths:
            if not path.exists():
                continue
            site = site_chunks(load_clean(path))
            file.write(json.dumps(site, ensure_ascii=False) + "\n")
            rows.append(
                {
                    "domain": site["domain"],
                    "chunks": len(site["chunks"]),
                    "tokens": sum(c["tokens_est"] for c in site["chunks"]),
                    "truncated": site["truncated"],
                    "dropped_tokens": site["dropped_tokens_est"],
                }
            )
    stats = pd.DataFrame(rows)
    print(f"{len(stats)} sites -> {out.relative_to(REPO_ROOT)}")
    per_site = stats["chunks"]
    print(f"chunks: {per_site.sum():,} (per site median {per_site.median():.0f}, max {per_site.max()})")
    print(f"tokens sent: {stats['tokens'].sum():,} (per site median {stats['tokens'].median():,.0f})")
    print(f"truncated sites: {stats['truncated'].sum()}, tokens left out: {stats['dropped_tokens'].sum():,}")


if __name__ == "__main__":
    main()
