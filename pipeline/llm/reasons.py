import json
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import pandas as pd

from pipeline.common.cli import reasons_parser
from pipeline.common.paths import EXPORT_DIR, REASONS_DIR, REPO_ROOT
from pipeline.common.runlog import RunLog
from pipeline.llm.client import BalanceUsedUp, CallFailed, JsonlOutput, call, load_prompt, make_client, render

PROMPT_MD = Path(__file__).resolve().parent / "prompts/REASON_PROMPT_v1.md"
CLAIMS_MASTER = EXPORT_DIR / "claims_master.csv"
FIRMS_MASTER = EXPORT_DIR / "firms_master.csv"
MAX_TOKENS = 8000
RETRY_SIZES = [5, 1]
TEMPLATE_SHARE = 0.01
TEMPLATES = {
    "red": (
        "«{quote}» uses general environmental wording that the quoted text does not specify.",
        "«{quote}» usa una formulazione ambientale generica che il testo citato non specifica.",
    ),
    "yellow": (
        "«{quote}» makes an environmental claim whose details the quoted text does not specify.",
        "«{quote}» contiene un'affermazione ambientale i cui dettagli non sono specificati nel testo citato.",
    ),
}


def load_claims() -> pd.DataFrame:
    claims = pd.read_csv(CLAIMS_MASTER, dtype={"bvd_id": str}, keep_default_na=False)
    names = pd.read_csv(FIRMS_MASTER, usecols=["domain", "name"]).drop_duplicates("domain")
    return claims.merge(names, on="domain", how="left")


def firm_jobs(claims: pd.DataFrame, max_claims: int) -> list[dict]:
    jobs = []
    for domain, group in claims.groupby("domain", sort=True):
        rows = group.sort_values("key").to_dict("records")
        for part, start in enumerate(range(0, len(rows), max_claims), 1):
            jobs.append(
                {
                    "key": f"{domain}|{max_claims}|{part}|{rows[start]['key']}",
                    "domain": domain,
                    "batch": rows[0]["batch"],
                    "name": rows[0]["name"] or domain,
                    "claims": rows[start : start + max_claims],
                }
            )
    return jobs


def curly_quotes(text: str) -> str:
    return re.sub(r'"([^"]*)"', "“\\1”", str(text)).replace('"', "”")


def claim_lines(claims: list[dict]) -> str:
    return "\n".join(
        json.dumps(
            {
                "id": number,
                "quote": curly_quotes(claim["quote"]),
                "context": curly_quotes(claim["context_snippet"]),
                "note": curly_quotes(claim["model_reason"]),
            },
            ensure_ascii=False,
        )
        for number, claim in enumerate(claims, 1)
    )


def matched(answer: dict | None, count: int) -> list[dict] | None:
    items = (answer or {}).get("claims", [])
    if sorted(item["id"] for item in items) != list(range(1, count + 1)):
        return None
    return sorted(items, key=lambda item: item["id"])


def write_reasons(client, model: str, prompt: dict, job: dict) -> dict:
    message = render(prompt["template"], {"firm_name": job["name"], "claims": claim_lines(job["claims"])})
    record = call(client, model, prompt, message, MAX_TOKENS)
    items = matched(record.get("answer"), len(job["claims"]))
    if items is None and not record["error"]:
        retry = call(client, model, prompt, message, MAX_TOKENS)
        retry["cost_usd"] += record["cost_usd"]
        record = retry
        items = matched(record.get("answer"), len(job["claims"]))
        if items is None and not record["error"]:
            record["error"] = "claim ids do not match the input"
    record.pop("answer", None)
    reasons = [
        {"key": claim["key"], "en": item["en"], "it": item["it"]}
        for claim, item in zip(job["claims"], items or [], strict=False)
    ]
    return {"key": job["key"], "domain": job["domain"], "batch": job["batch"], "claims": reasons} | record


def written(path: Path) -> set[tuple[str, str]]:
    if not path.exists():
        return set()
    done = set()
    for line in path.read_text().splitlines():
        if not line.strip():
            continue
        record = json.loads(line)
        for claim in record["claims"]:
            if str(claim.get("en") or "").strip() and str(claim.get("it") or "").strip():
                done.add((record["domain"], claim["key"]))
    return done


def missing(claims: pd.DataFrame, path: Path) -> pd.DataFrame:
    done = written(path)
    return claims[[(domain, key) not in done for domain, key in zip(claims.domain, claims.key, strict=True)]]


def short_quote(text: str, words: int = 12) -> str:
    parts = text.split()
    return " ".join(parts[:words]) + ("…" if len(parts) > words else "")


def template_record(domain: str, group: pd.DataFrame) -> dict:
    reasons = []
    for claim in group.to_dict("records"):
        en, it = TEMPLATES[claim["light"]]
        quote = short_quote(claim["quote"])
        reasons.append({"key": claim["key"], "en": en.format(quote=quote), "it": it.format(quote=quote)})
    first = group.iloc[0]
    return {
        "key": f"{domain}|template",
        "domain": domain,
        "batch": first["batch"],
        "claims": reasons,
        "model": "template",
        "source": "template",
        "error": None,
        "cost_usd": 0.0,
    }


def run_pass(args, prompt: dict, output: JsonlOutput, todo: pd.DataFrame, max_claims: int) -> None:
    jobs = firm_jobs(todo, max_claims)

    def run(job: dict) -> dict:
        record = write_reasons(client, args.model, prompt, job)
        output.write(record)
        return record

    with (
        RunLog(output.path.parent, "reasons", vars(args) | {"max_claims": max_claims}, len(jobs)) as log,
        make_client() as client,
        ThreadPoolExecutor(args.workers) as pool,
    ):
        for job in as_completed([pool.submit(run, job) for job in jobs]):
            try:
                r = job.result()
            except CallFailed as error:
                log.record("skipped", f"call failed, left for the next pass: {error}")
                continue
            except BalanceUsedUp as error:
                pool.shutdown(cancel_futures=True)
                raise SystemExit(str(error)) from None
            status = "error" if r["error"] else "ok"
            log.record(status, f"{r['domain']:30} claims={len(r['claims'])} {r['error'] or ''}")


def main(argv: list[str] | None = None) -> None:
    args = reasons_parser().parse_args(argv)
    claims = load_claims()
    if args.firms:
        claims = claims[claims.domain.isin(set(pd.read_csv(args.firms)["domain"]))]
    if args.batch:
        claims = claims[claims.batch == args.batch]
    name = args.output or args.batch or "all"
    output = JsonlOutput(REASONS_DIR / args.model / f"{name}.jsonl")
    prompt = load_prompt(PROMPT_MD)
    for size in [args.max_claims, *RETRY_SIZES]:
        todo = missing(claims, output.path)
        if todo.empty:
            break
        print(f"pass with {size} claims per call: {len(todo):,} claims at {todo.domain.nunique():,} firms", flush=True)
        run_pass(args, prompt, output, todo, size)
    left = missing(claims, output.path)
    if len(left) > TEMPLATE_SHARE * len(claims):
        raise SystemExit(f"{len(left):,} claims still without a reason; run the same command again")
    for domain, group in left.groupby("domain"):
        output.write(template_record(domain, group))
    final = missing(claims, output.path)
    print(f"{len(claims):,} claims: {len(claims) - len(left):,} written by the model, {len(left):,} from the template")
    print(f"missing: {len(final)} -> {output.path.relative_to(REPO_ROOT)}")
    if len(final):
        raise SystemExit(f"{len(final)} claims still missing")


if __name__ == "__main__":
    main()
