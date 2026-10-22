import sys
from pathlib import Path

import pandas as pd

from pipeline.common.paths import REPO_ROOT
from pipeline.common.text import normalize_claim_text
from pipeline.llm.client import JsonlOutput, call, load_prompt, make_client, render

PROMPT_MD = Path(__file__).resolve().parents[1] / "llm/prompts/ECGT_CLAIM_CLASSIFIER_PROMPT.md"
MAX_TOKENS = 150
GROUP_A = {
    "generic_green",
    "undefined_natural",
    "climate_neutral",
    "vague_comparison",
    "brand_eco_slogan",
    "vague_supply_chain",
    "legal_requirement_as_feature",
}


def user_message(template: str, row: pd.Series) -> str:
    return render(
        template,
        {
            "sentence": row["sentence"],
            "context_or_none": row["context"] if row["context"] != row["sentence"] else "none",
            "firm_name": row["name"],
            "page_url": row["page_url"],
        },
    )


def label_from(triggers: list[str]) -> str:
    found = set(triggers) - {"out_of_scope"}
    if not found:
        return "DISCARDED"
    if "defined_term" in found:
        found.discard("undefined_natural")
    return "IN_SCOPE" if found & GROUP_A else "NEEDS_VERIFICATION"


def classify(client, model: str, prompt: dict, row: pd.Series) -> dict:
    record = call(client, model, prompt, user_message(prompt["template"], row), MAX_TOKENS)
    answer = record.pop("answer")
    if answer:
        record.update(
            triggers="; ".join(answer["triggers"]),
            model_label=answer["label"],
            label=label_from(answer["triggers"]),
            confidence=answer["confidence"],
        )
    return record


def sentence_key(row: pd.Series) -> str:
    return f"{row['domain']}|{normalize_claim_text(row['sentence'])}"


if __name__ == "__main__":
    model = sys.argv[1] if len(sys.argv) > 1 else "deepseek-flash"
    firms_csv = Path(sys.argv[2]) if len(sys.argv) > 2 else REPO_ROOT / "data/pilot20.csv"
    firms = pd.read_csv(firms_csv)
    candidates_csv = sorted((REPO_ROOT / "data/candidates").glob("20*.csv.gz"))[-1]
    candidates = pd.read_csv(candidates_csv).merge(firms[["domain", "name"]], on="domain")
    output = JsonlOutput(REPO_ROOT / f"data/llm/{model}/{firms_csv.stem}.jsonl")
    prompt = load_prompt(PROMPT_MD)
    skip = output.done()
    with make_client() as client:
        for number, (_, row) in enumerate(candidates.iterrows(), 1):
            key = sentence_key(row)
            if key in skip:
                continue
            record = classify(client, model, prompt, row)
            line = {"key": key, "domain": row["domain"], "page_url": row["page_url"], "sentence": row["sentence"]}
            output.write(line | record)
            print(
                f"{number:>4}/{len(candidates)} {record.get('label', 'ERROR'):<19} "
                f"{record['seconds']:>5}s ${record['cost_usd']:.6f}  {row['sentence'][:60]}",
                flush=True,
            )
