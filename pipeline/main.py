import sys
import time
from datetime import datetime

from pipeline.common.cli import run_parser
from pipeline.common.paths import CHUNK_DIR, CLEAN_DIR, CRAWL_DIR
from pipeline.crawl import crawler, retry, summary
from pipeline.export import firms_json, ids, master, randomize, survey
from pipeline.firms import orbis_filter
from pipeline.llm import b2c, claims, export, reasons, review_sample
from pipeline.text import chunk, clean

STEPS = {
    "firms": orbis_filter.main,
    "crawl": crawler.main,
    "retry": retry.main,
    "summary": summary.main,
    "clean": clean.main,
    "chunk": chunk.main,
    "b2c": b2c.main,
    "claims": claims.main,
    "export": export.main,
    "review-sample": review_sample.main,
    "master": master.main,
    "randomize": randomize.main,
    "reasons": reasons.main,
    "ids": ids.main,
    "firms-json": firms_json.main,
    "survey": survey.main,
}
USAGE = f"""usage:
  python -m pipeline.main <step> [step options]   run one step ({", ".join(STEPS)})
  python -m pipeline.main run --firms CSV [...]    run several steps in order
  python -m pipeline.main batch split|crawl|llm   run the full firm list in batches
  python -m pipeline.main <step> --help           options of one step
  python -m pipeline.main run --help              options of a full run"""


def step_argv(step: str, args) -> list[str]:
    firms = str(args.firms)
    workers = ["--workers", str(args.workers)]
    llm = ["--firms", firms, "--workers", str(args.llm_workers), "--model", args.model]
    name = args.folder
    crawl_folder = [str(CRAWL_DIR / name)] if name else []
    clean_folder = [str(CLEAN_DIR / name)] if name else []
    chunks_file = [str(CHUNK_DIR / f"{name}.jsonl")] if name else []
    return {
        "firms": [],
        "crawl": [firms, *workers] + (["--force"] if args.force else []) + (["--folder", name] if name else []),
        "retry": [*crawl_folder, "--firms", firms, "--workers", str(args.browser_workers)],
        "summary": [firms, *crawl_folder],
        "clean": [*crawl_folder, "--firms", firms],
        "chunk": [*clean_folder, "--firms", firms],
        "b2c": [*clean_folder, *llm],
        "claims": [*chunks_file, *llm] + (["--b2c", args.b2c] if args.b2c else []),
        "export": [*chunks_file, "--firms", firms, "--model", args.model],
    }[step]


def run(argv: list[str]) -> None:
    args = run_parser().parse_args(argv)
    steps = [step for step in STEPS if step in args.steps]
    print(f"steps: {', '.join(steps)}", flush=True)
    for step in steps:
        step_args = step_argv(step, args)
        print(f"\n=== {step} ({datetime.now():%H:%M:%S}): {' '.join(step_args)}", flush=True)
        start = time.monotonic()
        STEPS[step](step_args)
        print(f"=== {step} done in {time.monotonic() - start:.0f} s", flush=True)


def main(argv: list[str] | None = None) -> None:
    argv = sys.argv[1:] if argv is None else argv
    if not argv or argv[0] in ("-h", "--help"):
        print(USAGE)
    elif argv[0] == "run":
        run(argv[1:])
    elif argv[0] == "batch":
        from pipeline import batch

        batch.main(argv[1:])
    elif argv[0] in STEPS:
        STEPS[argv[0]](argv[1:])
    else:
        sys.exit(f"unknown step {argv[0]!r}\n\n{USAGE}")


if __name__ == "__main__":
    main()
