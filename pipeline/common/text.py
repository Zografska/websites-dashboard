import re
import unicodedata

import pysbd

SEGMENTER = pysbd.Segmenter(language="it", clean=False)
BOILERPLATE_WORDS = ["cookie", "privacy", "gdpr", "informativa", "consenso", "trattamento dei dati"]
BOILERPLATE_WHOLE_WORDS = ["accetta"]


def is_boilerplate(sentence: str) -> bool:
    lowered = sentence.lower()
    for word in BOILERPLATE_WORDS:
        if word in lowered:
            return True
    for word in BOILERPLATE_WHOLE_WORDS:
        if re.search(rf"\b{word}\b", lowered):
            return True
    return False


def normalize_claim_text(text: str) -> str:
    s = unicodedata.normalize("NFKC", text).lower()
    s = "".join(ch for ch in s if not unicodedata.category(ch).startswith(("P", "S")))
    return " ".join(s.split())
