import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

import yaml

from pipeline.common.text import normalize_claim_text

KEYWORDS_YAML = Path(__file__).resolve().parent / "keywords.yaml"
MIN_KEYWORDS = 2
MIN_OVERLAP_CHARS = 25
STRONG_KEYWORDS = [
    "sostenibil*",
    "sustainab*",
    "ecosostenibile",
    "eco-friendly",
    "ricicl*",
    "recycl*",
    "biodegradabil*",
    "biodegradab*",
    "compostabil*",
    "compostab*",
    "rinnovabil*",
    "renewab*",
    "CO2",
    "emission*",
    "net zero",
    "neutralità climatica",
    "climate neutrality",
    "carbon footprint",
    "microplastic*",
    "PFAS",
    "biodiversità",
    "biodiversity",
    "Ecolabel",
    "FSC",
    "Fairtrade",
    "B Corp",
]


def keyword_pattern(keyword: str) -> re.Pattern:
    words = [re.escape(word) for word in keyword.lower().split()]
    body = r"\s+".join(words).replace(r"\*", r"\w*")
    return re.compile(rf"(?<!\w){body}(?!\w)")


def load_keywords(path: Path = KEYWORDS_YAML) -> list[tuple[str, re.Pattern]]:
    groups = yaml.safe_load(path.read_text())
    return [
        (keyword, keyword_pattern(keyword))
        for languages in groups.values()
        for keywords in languages.values()
        for keyword in keywords
    ]


def match_keywords(text: str, keywords: list[tuple[str, re.Pattern]]) -> list[str]:
    lowered = unicodedata.normalize("NFKC", text).lower()
    return [keyword for keyword, pattern in keywords if pattern.search(lowered)]


def overlap(a: str, b: str) -> int:
    return SequenceMatcher(None, a, b, autojunk=False).find_longest_match(0, len(a), 0, len(b)).size


def covered(line: str, quotes: list[str]) -> bool:
    key = normalize_claim_text(line)
    needed = min(MIN_OVERLAP_CHARS, len(key))
    return any(q and overlap(key, q) >= needed for q in (normalize_claim_text(quote) for quote in quotes))


def matched_words(text: str, keywords: list[tuple[str, re.Pattern]]) -> set[str]:
    lowered = unicodedata.normalize("NFKC", text).lower()
    return {match.group(0) for _, pattern in keywords for match in pattern.finditer(lowered)}


def possible_misses(chunk_text: str, quotes: list[str], keywords: list[tuple[str, re.Pattern]]) -> list[dict]:
    misses = []
    for line in dict.fromkeys(chunk_text.splitlines()):
        found = match_keywords(line, keywords)
        strong = [keyword for keyword in found if keyword in STRONG_KEYWORDS]
        if (len(matched_words(line, keywords)) >= MIN_KEYWORDS or strong) and not covered(line, quotes):
            misses.append({"text": line, "keywords": found, "why": "strong keyword" if strong else "two keywords"})
    return misses
