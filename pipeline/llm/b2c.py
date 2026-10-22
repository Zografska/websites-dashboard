import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pandas as pd

from pipeline.common.cli import b2c_args
from pipeline.common.paths import CLEAN_DIR, FIRMS_CSV, REPO_ROOT
from pipeline.common.runlog import RunLog
from pipeline.llm.client import JsonlOutput, call, load_prompt, make_client, render
from pipeline.text.chunk import load_clean, tokens

PROMPT_MD = Path(__file__).resolve().parent / "prompts/B2C_PROMPT.md"
B2C_DIR = REPO_ROOT / "data/b2c"
TEXT_TOKENS = 2500
MAX_TOKENS = 200


def website_text(site: dict) -> str:
    parts, budget = [], TEXT_TOKENS
    for page in site["pages"]:
        block = f"--- {page['url']} ---\n{page['text']}"
        if tokens(block) > budget:
            block = block[: int(budget * 4)]
        parts.append(block)
        budget -= tokens(block)
        if budget <= 0:
            break
    return "\n".join(parts)


def squash(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def check_firm(client, model: str, prompt: dict, firm: dict, site: dict) -> dict:
    text = website_text(site)
    message = render(
        prompt["template"],
        {"firm_name": firm["name"], "sector": firm.get("ateco_description") or "unknown", "website_text": text},
    )
    record = call(client, model, prompt, message, MAX_TOKENS)
    answer = record.pop("answer") or {}
    return {
        "key": site["domain"],
        "domain": site["domain"],
        "name": firm["name"],
        "in_b2c_sector": firm.get("in_b2c_sector"),
        "b2c": answer.get("b2c"),
        "evidence": answer.get("evidence"),
        "evidence_found": bool(answer.get("evidence")) and squash(answer["evidence"]) in squash(text),
        "reason": answer.get("reason"),
        "confidence": answer.get("confidence"),
        "input_tokens_est": tokens(message),
    } | record


if __name__ == "__main__":
    args = b2c_args()
    folder = args.folder or sorted(CLEAN_DIR.glob("20*"))[-1]
    firms = pd.read_csv(FIRMS_CSV).drop_duplicates("domain").set_index("domain")
    domains = pd.read_csv(args.firms)["domain"].tolist() if args.firms else None
    paths = [folder / f"{d}.json.gz" for d in domains] if domains else sorted(folder.glob("*.json.gz"))
    paths = [path for path in paths if path.exists()]
    output = JsonlOutput(B2C_DIR / args.model / f"{folder.name}.jsonl")
    done = output.done()
    todo = [path for path in paths if path.name.removesuffix(".json.gz") not in done]
    prompt = load_prompt(PROMPT_MD)

    def run(path: Path) -> dict:
        site = load_clean(path)
        firm = firms.loc[site["domain"]].to_dict() if site["domain"] in firms.index else {"name": site["domain"]}
        record = check_firm(client, args.model, prompt, firm, site)
        output.write(record)
        return record

    with (
        RunLog(output.path.parent, "b2c", vars(args), len(todo)) as log,
        make_client() as client,
        ThreadPoolExecutor(args.workers) as pool,
    ):
        for job in as_completed([pool.submit(run, path) for path in todo]):
            r = job.result()
            note = r["reason"] or r["error"]
            log.record(str(r["b2c"]), f"{r['domain']:32} {r['b2c']!s:8} {r['confidence'] or 0:.2f}  {note}")
