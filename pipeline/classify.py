import json
import os
import re
import sys
import time
from datetime import UTC, datetime
from pathlib import Path

import httpx
import pandas as pd

from crawler import REPO_ROOT
from sentences import normalize_claim_text

PROMPT_MD = Path(__file__).resolve().parent / "prompts/ECGT_CLAIM_CLASSIFIER_PROMPT.md"
API_URL = "https://api.deepseek.com/chat/completions"
MAX_TOKENS = 150
TIMEOUT_SECONDS = 60
PRICES = {
    "deepseek-flash": {"hit": 0.006, "miss": 0.3, "output": 1.2},
    "deepseek-v4-pro": {"hit": 0.044, "miss": 1.32, "output": 3.96},
}
PEAK_HOURS_UTC = [(1, 4), (6, 10)]
GROUP_A = {
    "generic_green",
    "undefined_natural",
    "climate_neutral",
    "vague_comparison",
    "brand_eco_slogan",
    "vague_supply_chain",
    "legal_requirement_as_feature",
}
LABELS = {"IN_SCOPE", "NEEDS_VERIFICATION", "DISCARDED"}


def load_api_key() -> str:
    for line in (REPO_ROOT / ".env").read_text().splitlines():
        name, _, value = line.partition("=")
        if name.strip() == "DEEPSEEK_API_KEY":
            return value.strip()
    return os.environ["DEEPSEEK_API_KEY"]


def section_block(markdown: str, heading: str) -> str:
    section = markdown.split(f"## {heading}", 1)[1]
    return re.search(r"```(?:json)?\n(.*?)```", section, re.S).group(1).strip()


def load_prompt(path: Path) -> dict:
    markdown = path.read_text()
    shots = []
    for example in section_block(markdown, "Few-shot").split("\n\n"):
        user, answer = example.split("\n→ ")
        shots += [{"role": "user", "content": user.strip()}, {"role": "assistant", "content": answer.strip()}]
    schema = json.loads(section_block(markdown, "Schema"))
    return {
        "system": section_block(markdown, "System prompt"),
        "shots": shots,
        "template": section_block(markdown, "User message template"),
        "triggers": set(schema["properties"]["triggers"]["items"]["enum"]),
    }


def user_message(template: str, row: pd.Series) -> str:
    values = {
        "sentence": row["sentence"],
        "context_or_none": row["context"] if row["context"] != row["sentence"] else "none",
        "firm_name": row["name"],
        "page_url": row["page_url"],
    }
    return re.sub(r"\{\{(\w+)\}\}", lambda m: str(values[m.group(1)]), template)


def label_from(triggers: list[str]) -> str:
    found = set(triggers) - {"out_of_scope"}
    if not found:
        return "DISCARDED"
    if "defined_term" in found:
        found.discard("undefined_natural")
    return "IN_SCOPE" if found & GROUP_A else "NEEDS_VERIFICATION"


def check_answer(answer: dict, allowed: set[str]) -> str | None:
    triggers = answer.get("triggers")
    if not isinstance(triggers, list) or not triggers:
        return "missing triggers"
    if unknown := set(triggers) - allowed:
        return f"unknown triggers {sorted(unknown)}"
    if answer.get("label") not in LABELS:
        return "bad label"
    confidence = answer.get("confidence")
    if not isinstance(confidence, int | float) or not 0 <= confidence <= 1:
        return "bad confidence"
    return None


def is_peak(moment: datetime) -> bool:
    return moment.weekday() < 5 and any(start <= moment.hour < end for start, end in PEAK_HOURS_UTC)


def call_cost(model: str, usage: dict, peak: bool) -> float:
    price = PRICES[model]
    cost = (
        usage.get("prompt_cache_hit_tokens", 0) * price["hit"]
        + usage.get("prompt_cache_miss_tokens", 0) * price["miss"]
        + usage.get("completion_tokens", 0) * price["output"]
    ) / 1e6
    return cost if peak else cost / 2


def classify(client: httpx.Client, model: str, prompt: dict, row: pd.Series) -> dict:
    messages = [
        {"role": "system", "content": prompt["system"]},
        *prompt["shots"],
        {"role": "user", "content": user_message(prompt["template"], row)},
    ]
    body = {
        "model": model,
        "messages": messages,
        "temperature": 0,
        "max_tokens": MAX_TOKENS,
        "response_format": {"type": "json_object"},
        "thinking": {"type": "disabled"},
    }
    called_at = datetime.now(UTC)
    start = time.monotonic()
    response = client.post(API_URL, json=body)
    seconds = round(time.monotonic() - start, 2)
    response.raise_for_status()
    data = response.json()
    usage = data.get("usage", {})
    peak = is_peak(called_at)
    record = {
        "model": data.get("model"),
        "request_id": data.get("id"),
        "called_at": called_at.isoformat(timespec="seconds"),
        "peak": peak,
        "seconds": seconds,
        "cache_hit_tokens": usage.get("prompt_cache_hit_tokens", 0),
        "cache_miss_tokens": usage.get("prompt_cache_miss_tokens", 0),
        "output_tokens": usage.get("completion_tokens", 0),
        "cost_usd": call_cost(model, usage, peak),
        "raw_answer": data["choices"][0]["message"]["content"],
    }
    try:
        answer = json.loads(record["raw_answer"])
        record["error"] = check_answer(answer, prompt["triggers"])
    except json.JSONDecodeError:
        answer, record["error"] = {}, "not json"
    if not record["error"]:
        record.update(
            triggers="; ".join(answer["triggers"]),
            model_label=answer["label"],
            label=label_from(answer["triggers"]),
            confidence=answer["confidence"],
        )
    return record


def sentence_key(row: pd.Series) -> str:
    return f"{row['domain']}|{normalize_claim_text(row['sentence'])}"


def done_keys(path: Path) -> set[str]:
    if not path.exists():
        return set()
    return {json.loads(line)["key"] for line in path.read_text().splitlines() if line}


if __name__ == "__main__":
    model = sys.argv[1] if len(sys.argv) > 1 else "deepseek-flash"
    firms_csv = Path(sys.argv[2]) if len(sys.argv) > 2 else REPO_ROOT / "data/pilot20.csv"
    firms = pd.read_csv(firms_csv)
    candidates_csv = sorted((REPO_ROOT / "data/candidates").glob("20*.csv.gz"))[-1]
    candidates = pd.read_csv(candidates_csv).merge(firms[["domain", "name"]], on="domain")
    out = REPO_ROOT / f"data/llm/{model}/{firms_csv.stem}.jsonl"
    out.parent.mkdir(parents=True, exist_ok=True)
    prompt = load_prompt(PROMPT_MD)
    skip = done_keys(out)
    headers = {"Authorization": f"Bearer {load_api_key()}"}
    with httpx.Client(headers=headers, timeout=TIMEOUT_SECONDS) as client, out.open("a") as file:
        for number, (_, row) in enumerate(candidates.iterrows(), 1):
            key = sentence_key(row)
            if key in skip:
                continue
            record = classify(client, model, prompt, row)
            if record["error"]:
                record = classify(client, model, prompt, row) | {"retried": True}
            line = {"key": key, "domain": row["domain"], "page_url": row["page_url"], "sentence": row["sentence"]}
            file.write(json.dumps(line | record, ensure_ascii=False) + "\n")
            file.flush()
            print(
                f"{number:>4}/{len(candidates)} {record.get('label', 'ERROR'):<19} "
                f"{record['seconds']:>5}s ${record['cost_usd']:.6f}  {row['sentence'][:60]}",
                flush=True,
            )
