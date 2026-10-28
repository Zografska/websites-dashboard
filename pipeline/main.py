import sys
import time
from datetime import datetime

from pipeline.common.cli import run_parser
from pipeline.crawl import crawler, retry, summary
from pipeline.firms import orbis_filter
from pipeline.llm import b2c, claims, export, review_sample
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
}
USAGE = f"""usage:
  python -m pipeline.main <step> [step options]   run one step ({", ".join(STEPS)})
  python -m pipeline.main run --firms CSV [...]    run several steps in order
  python -m pipeline.main <step> --help           options of one step
  python -m pipeline.main run --help              options of a full run"""


def step_argv(step: str, args) -> list[str]:
    firms = str(args.firms)
    workers = ["--workers", str(args.workers)]
    llm = ["--firms", firms, "--workers", str(args.llm_workers), "--model", args.model]
    return {
        "firms": [],
        "crawl": [firms, *workers] + (["--force"] if args.force else []),
        "retry": ["--firms", firms, "--workers", str(args.browser_workers)],
        "summary": [firms],
        "clean": ["--firms", firms],
        "chunk": ["--firms", firms],
        "b2c": llm,
        "claims": llm,
        "export": ["--firms", firms, "--model", args.model],
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
    elif argv[0] in STEPS:
        STEPS[argv[0]](argv[1:])
    else:
        sys.exit(f"unknown step {argv[0]!r}\n\n{USAGE}")


if __name__ == "__main__":
    main()
