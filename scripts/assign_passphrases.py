#!/usr/bin/env python3
"""Assign each firm a passphrase, derived from its firm_id and a secret salt.

Usage (the salt comes from the environment, never from a file or argument):

    FIRM_PASSPHRASE_SALT="$(cat /path/to/salt)" python3 scripts/assign_passphrases.py

Options:
    --csv       firm mapping CSV (default: firm_mappings.csv)
    --out       output CSV (default: analytics_exports/firm_passphrases.csv)
    --wordlist  word list (default: scripts/passphrase_words.txt)
    --salt-env  name of the environment variable holding the salt
                (default: FIRM_PASSPHRASE_SALT)

How a passphrase is made:
    For each firm_id and word position i = 0..3, HMAC-SHA256(salt, "firm_id|counter")
    gives a number, which picks a word from the list. Repeats within one passphrase are
    skipped. Four words joined by "-" make the passphrase, e.g. "aalii-zebra-...".
    Without the salt, nobody can recompute a passphrase from a firm_id. The same salt
    always gives the same passphrases, so the script can be rerun safely.

Output: one row per firm, columns firm_id,passphrase. The output holds plaintext
passphrases, so it is written with mode 0600 and goes under analytics_exports/, which
is gitignored. Do not commit it or paste it anywhere. The bvd_id column is not used.

Only the standard library is needed.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import hmac
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent

MIN_SALT_CHARS = 32
WORDS_PER_PASSPHRASE = 4  # the encrypt script requires at least 4 words and 20 characters


def load_words(path: Path) -> list[str]:
    words = [w.strip() for w in path.read_text(encoding="utf-8").splitlines() if w.strip()]
    if len(words) < 2**15:
        sys.exit(f"Wordlist {path} has only {len(words)} words; need at least 32768.")
    return words


def load_firm_ids(path: Path) -> list[str]:
    """Read firm_id from the CSV. The file may have a title line before the header."""
    with path.open(encoding="utf-8", newline="") as fh:
        lines = fh.read().splitlines()
    header_at = next((i for i, line in enumerate(lines) if line.split(";")[0].strip() == "firm_id"), None)
    if header_at is None:
        sys.exit(f"No 'firm_id' header found in {path}.")
    ids: list[str] = []
    seen: set[str] = set()
    for line in lines[header_at + 1:]:
        if not line.strip():
            continue
        firm_id = line.split(";")[0].strip()
        if firm_id in seen:
            sys.exit(f"Duplicate firm_id in {path}: {firm_id}")
        seen.add(firm_id)
        ids.append(firm_id)
    if not ids:
        sys.exit(f"No firm rows in {path}.")
    return ids


def passphrase_for(firm_id: str, salt: bytes, words: list[str]) -> str:
    chosen: list[str] = []
    counter = 0
    while len(chosen) < WORDS_PER_PASSPHRASE:
        msg = f"{firm_id}|{counter}".encode("utf-8")
        digest = hmac.new(salt, msg, hashlib.sha256).digest()
        word = words[int.from_bytes(digest[:8], "big") % len(words)]
        if word not in chosen:
            chosen.append(word)
        counter += 1
    return "-".join(chosen)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--csv", type=Path, default=ROOT / "firm_mappings.csv")
    parser.add_argument("--out", type=Path, default=ROOT / "analytics_exports" / "firm_passphrases.csv")
    parser.add_argument("--wordlist", type=Path, default=HERE / "passphrase_words.txt")
    parser.add_argument("--salt-env", default="FIRM_PASSPHRASE_SALT")
    args = parser.parse_args()

    salt_text = os.environ.get(args.salt_env, "")
    if len(salt_text) < MIN_SALT_CHARS:
        sys.exit(f"Set {args.salt_env} to a secret of at least {MIN_SALT_CHARS} characters.")
    salt = salt_text.encode("utf-8")

    words = load_words(args.wordlist)
    firm_ids = load_firm_ids(args.csv)

    rows: list[tuple[str, str]] = []
    seen_passphrases: set[str] = set()
    for firm_id in firm_ids:
        phrase = passphrase_for(firm_id, salt, words)
        if phrase in seen_passphrases:
            sys.exit(f"Passphrase collision for {firm_id}; use a different salt or a longer word list.")
        seen_passphrases.add(phrase)
        rows.append((firm_id, phrase))

    args.out.parent.mkdir(parents=True, exist_ok=True)
    tmp = args.out.with_suffix(args.out.suffix + ".tmp")
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8", newline="") as fh:
        writer = csv.writer(fh)
        writer.writerow(["firm_id", "passphrase"])
        writer.writerows(rows)
    os.replace(tmp, args.out)

    print(f"Wrote {len(rows)} passphrases to {args.out} (mode 0600). Passphrases were not printed.")


if __name__ == "__main__":
    main()
