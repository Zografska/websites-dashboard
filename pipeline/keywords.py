import re
import sys
import unicodedata
from pathlib import Path

import pandas as pd
import yaml

from crawler import REPO_ROOT

KEYWORDS_YAML = Path(__file__).resolve().parent / "keywords.yaml"


def keyword_pattern(keyword: str) -> re.Pattern:
    words = [re.escape(word) for word in keyword.lower().split()]
    body = r"\s+".join(words).replace(r"\*", r"\w*")
    return re.compile(rf"(?<!\w){body}(?!\w)")


def load_keywords(path: Path) -> list[tuple[str, str, re.Pattern]]:
    groups = yaml.safe_load(path.read_text())
    return [
        (keyword, group, keyword_pattern(keyword))
        for group, languages in groups.items()
        for keywords in languages.values()
        for keyword in keywords
    ]


def match_keywords(sentence: str, keywords: list[tuple[str, str, re.Pattern]]) -> list[tuple[str, str]]:
    text = unicodedata.normalize("NFKC", sentence).lower()
    return [(keyword, group) for keyword, group, pattern in keywords if pattern.search(text)]


def add_matches(sentences: pd.DataFrame, keywords: list[tuple[str, str, re.Pattern]]) -> pd.DataFrame:
    matches = sentences["sentence"].map(lambda sentence: match_keywords(sentence, keywords))
    return sentences.assign(
        keywords=matches.map(lambda found: "; ".join(keyword for keyword, _ in found)),
        groups=matches.map(lambda found: "; ".join(sorted({group for _, group in found}))),
    )


if __name__ == "__main__":
    sentences_csv = (
        Path(sys.argv[1]) if len(sys.argv) > 1 else sorted((REPO_ROOT / "data/sentences").glob("*.csv.gz"))[-1]
    )
    sentences = pd.read_csv(sentences_csv)
    matched = add_matches(sentences, load_keywords(KEYWORDS_YAML))
    candidates = matched[matched["keywords"] != ""]
    out = REPO_ROOT / "data/candidates" / sentences_csv.name
    out.parent.mkdir(parents=True, exist_ok=True)
    candidates.to_csv(out, index=False)
    print(f"{len(candidates):,} of {len(sentences):,} sentences matched -> {out.relative_to(REPO_ROOT)}")
    print(f"sites with at least one match: {candidates['domain'].nunique()} of {sentences['domain'].nunique()}")
