import json
import os
import re
import threading
import time
from datetime import UTC, datetime
from pathlib import Path

import httpx

from pipeline.common.paths import REPO_ROOT

API_URL = "https://api.deepseek.com/chat/completions"
DEFAULT_MODEL = "deepseek-v4-pro"
TIMEOUT_SECONDS = 120
PRICES = {
    "deepseek-flash": {"hit": 0.006, "miss": 0.3, "output": 1.2},
    "deepseek-v4-pro": {"hit": 0.044, "miss": 1.32, "output": 3.96},
}
PEAK_HOURS_UTC = [(1, 4), (6, 10)]
TYPES = {"object": dict, "array": list, "string": str, "number": (int, float), "integer": int, "boolean": bool}


def load_api_key() -> str:
    env = REPO_ROOT / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            name, _, value = line.partition("=")
            if name.strip() == "DEEPSEEK_API_KEY":
                return value.strip()
    return os.environ["DEEPSEEK_API_KEY"]


def make_client() -> httpx.Client:
    return httpx.Client(headers={"Authorization": f"Bearer {load_api_key()}"}, timeout=TIMEOUT_SECONDS)


def section_block(markdown: str, heading: str) -> str:
    section = markdown.split(f"## {heading}", 1)[1]
    return re.search(r"```(?:json)?\n(.*?)```", section, re.S).group(1).strip()


def load_prompt(path: Path) -> dict:
    markdown = path.read_text()
    shots = []
    for example in section_block(markdown, "Few-shot").split("\n\n"):
        user, answer = example.split("\n→ ")
        shots += [{"role": "user", "content": user.strip()}, {"role": "assistant", "content": answer.strip()}]
    return {
        "system": section_block(markdown, "System prompt"),
        "shots": shots,
        "template": section_block(markdown, "User message template"),
        "schema": json.loads(section_block(markdown, "Schema")),
    }


def render(template: str, values: dict) -> str:
    return re.sub(r"\{\{(\w+)\}\}", lambda m: str(values[m.group(1)]), template)


def schema_error(value, schema: dict, path: str = "answer") -> str | None:
    expected = TYPES.get(schema.get("type"))
    if expected and (not isinstance(value, expected) or isinstance(value, bool) and expected is not bool):
        return f"{path}: expected {schema['type']}"
    if "enum" in schema and value not in schema["enum"]:
        return f"{path}: {value!r} not allowed"
    if isinstance(value, int | float) and not isinstance(value, bool):
        if value < schema.get("minimum", value) or value > schema.get("maximum", value):
            return f"{path}: {value} out of range"
    if isinstance(value, list):
        if len(value) < schema.get("minItems", 0):
            return f"{path}: too few items"
        for index, item in enumerate(value):
            if error := schema_error(item, schema.get("items", {}), f"{path}[{index}]"):
                return error
    if isinstance(value, dict):
        for key in schema.get("required", []):
            if key not in value:
                return f"{path}: missing {key}"
        for key, sub in schema.get("properties", {}).items():
            if key in value and (error := schema_error(value[key], sub, f"{path}.{key}")):
                return error
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


def call_once(client: httpx.Client, model: str, prompt: dict, user_text: str, max_tokens: int) -> dict:
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": prompt["system"]},
            *prompt["shots"],
            {"role": "user", "content": user_text},
        ],
        "temperature": 0,
        "max_tokens": max_tokens,
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
        "finish_reason": data["choices"][0].get("finish_reason"),
        "raw_answer": data["choices"][0]["message"]["content"],
        "answer": None,
    }
    try:
        answer = json.loads(record["raw_answer"])
        record["error"] = schema_error(answer, prompt["schema"])
        record["answer"] = None if record["error"] else answer
    except json.JSONDecodeError:
        record["error"] = "not json" if record["finish_reason"] != "length" else "answer cut off (max_tokens)"
    return record


def call(client: httpx.Client, model: str, prompt: dict, user_text: str, max_tokens: int) -> dict:
    record = call_once(client, model, prompt, user_text, max_tokens)
    if record["error"]:
        retry = call_once(client, model, prompt, user_text, max_tokens)
        retry["cost_usd"] += record["cost_usd"]
        retry["first_error"] = record["error"]
        record = retry
    return record


class JsonlOutput:
    def __init__(self, path: Path):
        self.path = path
        self.lock = threading.Lock()
        path.parent.mkdir(parents=True, exist_ok=True)

    def done(self) -> set[str]:
        if not self.path.exists():
            return set()
        return {json.loads(line)["key"] for line in self.path.read_text().splitlines() if line.strip()}

    def write(self, record: dict) -> None:
        with self.lock, self.path.open("a") as file:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")
