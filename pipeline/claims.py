import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pandas as pd

from chunk import CHUNK_DIR, load_clean
from clean import CLEAN_DIR
from cli import claims_args
from crawler import REPO_ROOT
from llm import JsonlOutput, call, load_prompt, make_client, render
from runlog import RunLog
from sentences import normalize_claim_text

PROMPT_MD = Path(__file__).resolve().parent / "prompts/CLAIM_EXTRACTION_PROMPT.md"
FIRMS_CSV = REPO_ROOT / "data/firms_filtered.csv"
CLAIMS_DIR = REPO_ROOT / "data/claims"
MAX_TOKENS = 2000
CONTEXT_CHARS = 200
GROUP_A = [
    "generic_green",
    "undefined_natural",
    "climate_neutral",
    "vague_comparison",
    "brand_eco_slogan",
    "vague_supply_chain",
    "legal_requirement_as_feature",
]
GROUP_B = [
    "certification",
    "recycled_recyclable",
    "biodegradable",
    "renewable_energy",
    "future_performance",
    "named_endorsement",
    "vegan",
    "farming_practice",
    "pollutant_free",
    "named_comparison",
    "risk_reduction",
    "defined_term",
]


def squash(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def label_from(triggers: list[str]) -> str:
    found = set(triggers)
    if "defined_term" in found:
        found.discard("undefined_natural")
    return "IN_SCOPE" if found & set(GROUP_A) else "NEEDS_VERIFICATION"


def category_from(triggers: list[str]) -> str:
    found = set(triggers)
    if "defined_term" in found:
        found.discard("undefined_natural")
    return next((t for t in GROUP_A + GROUP_B if t in found), triggers[0])


def gray_zone_from(triggers: list[str]) -> str | None:
    found = set(triggers)
    if "defined_term" in found and "undefined_natural" in found:
        return "natural_footnote"
    if found & set(GROUP_A) and found & (set(GROUP_B) - {"defined_term"}):
        return "generic_plus_specific"
    return None


# TODO: the context snippet is built from the cleaned page text. The sentence route took context from the page
# before cleaning (decided 13 Oct) so lead-ins dropped by cleaning stay visible; switch to the raw crawl text
# here if the dashboard needs that.
def context_snippet(page_text: str, quote: str) -> str:
    blocks = page_text.splitlines()
    target = squash(quote).lower()
    for index, block in enumerate(blocks):
        if target in squash(block).lower():
            before = blocks[index - 1][-CONTEXT_CHARS:] if index > 0 else ""
            after = blocks[index + 1][:CONTEXT_CHARS] if index + 1 < len(blocks) else ""
            return " ".join(part for part in (before, block, after) if part)
    flat = squash(page_text)
    start = flat.lower().find(target)
    if start < 0:
        return ""
    return flat[max(0, start - CONTEXT_CHARS) : start + len(target) + CONTEXT_CHARS]


def check_claim(claim: dict, chunk_text: str, page_text: str) -> dict:
    quote_found = squash(claim["quote"]).lower() in squash(chunk_text).lower()
    return {
        "quote": claim["quote"],
        "quote_found": quote_found,
        "key": normalize_claim_text(claim["quote"]),
        "triggers": claim["triggers"],
        "model_label": claim["label"],
        "label": label_from(claim["triggers"]),
        "category": category_from(claim["triggers"]),
        "gray_zone": gray_zone_from(claim["triggers"]),
        "confidence": claim["confidence"],
        "reason": claim["reason"],
        "context_snippet": context_snippet(page_text, claim["quote"]) if quote_found else "",
    }


def extract(client, model: str, prompt: dict, firm_name: str, chunk: dict, page_text: str) -> dict:
    message = render(prompt["template"], {"firm_name": firm_name, "page_url": chunk["page_url"], "text": chunk["text"]})
    record = call(client, model, prompt, message, MAX_TOKENS)
    answer = record.pop("answer") or {}
    claims = [check_claim(claim, chunk["text"], page_text) for claim in answer.get("claims", [])]
    return {
        "key": f"{chunk['domain']}|{chunk['page_url']}|{chunk['chunk']}",
        "domain": chunk["domain"],
        "page_url": chunk["page_url"],
        "chunk": chunk["chunk"],
        "of": chunk["of"],
        "claims": claims,
    } | record


if __name__ == "__main__":
    args = claims_args()
    chunks_file = args.chunks or sorted(CHUNK_DIR.glob("20*.jsonl"))[-1]
    domains = set(pd.read_csv(args.firms)["domain"]) if args.firms else None
    sites = [json.loads(line) for line in chunks_file.read_text().splitlines() if line.strip()]
    sites = [site for site in sites if domains is None or site["domain"] in domains]
    names = pd.read_csv(FIRMS_CSV, usecols=["domain", "name"]).drop_duplicates("domain").set_index("domain")["name"]
    output = JsonlOutput(CLAIMS_DIR / args.model / f"{chunks_file.stem}.jsonl")
    done = output.done()
    prompt = load_prompt(PROMPT_MD)
    clean_folder = CLEAN_DIR / chunks_file.stem
    jobs_in = [
        (site, chunk)
        for site in sites
        for chunk in site["chunks"]
        if f"{chunk['domain']}|{chunk['page_url']}|{chunk['chunk']}" not in done
    ]
    page_texts = {}
    for site in sites:
        clean = load_clean(clean_folder / f"{site['domain']}.json.gz")
        page_texts.update({(site["domain"], page["url"]): page["text"] for page in clean["pages"]})

    def run(site: dict, chunk: dict) -> dict:
        name = names.get(site["domain"], site["domain"])
        record = extract(client, args.model, prompt, name, chunk, page_texts[(site["domain"], chunk["page_url"])])
        output.write(record)
        return record

    with (
        RunLog(output.path.parent, "claims", vars(args), len(jobs_in)) as log,
        make_client() as client,
        ThreadPoolExecutor(args.workers) as pool,
    ):
        for job in as_completed([pool.submit(run, site, chunk) for site, chunk in jobs_in]):
            r = job.result()
            status = "error" if r["error"] else ("claims" if r["claims"] else "none")
            log.record(status, f"{r['domain']:30} {r['chunk']}/{r['of']} claims={len(r['claims'])} {r['error'] or ''}")
