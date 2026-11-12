import time
from datetime import UTC, datetime
from pathlib import Path

import httpx
import pandas as pd

from pipeline.common.cli import batch_parser
from pipeline.common.paths import CRAWL_DIR, FIRMS_CSV
from pipeline.llm.client import balance_usd, is_peak, make_client

BATCH_DIR = CRAWL_DIR / "full"
PREFIX = "full"


def batch_name(number: int) -> str:
    return f"{PREFIX}-{number:02d}"


def batch_csv(number: int) -> Path:
    return BATCH_DIR / f"batch_{number:02d}.csv"


def marker(number: int, stage: str) -> Path:
    return BATCH_DIR / f"{batch_name(number)}.{stage}"


def batch_numbers(only: list[int] | None) -> list[int]:
    found = sorted(int(path.stem.removeprefix("batch_")) for path in BATCH_DIR.glob("batch_*.csv"))
    if not found:
        raise SystemExit("no batches yet; run `python -m pipeline.main batch split` first")
    return [n for n in found if only is None or n in only]


def split(args) -> None:
    if any(BATCH_DIR.glob("batch_*.csv")) and not args.force:
        raise SystemExit(f"batches already exist in {BATCH_DIR}; use --force to redraw them")
    firms = pd.read_csv(FIRMS_CSV).drop_duplicates("domain")
    todo = firms.sample(frac=1, random_state=args.seed)
    BATCH_DIR.mkdir(parents=True, exist_ok=True)
    for old in BATCH_DIR.glob("batch_*.csv"):
        old.unlink()
    bounds = [round(len(todo) * k / args.batches) for k in range(args.batches + 1)]
    for number in range(1, args.batches + 1):
        todo.iloc[bounds[number - 1] : bounds[number]].to_csv(batch_csv(number), index=False)
    size = len(todo) // args.batches
    print(f"{len(todo):,} sites")
    print(f"{args.batches} batches of about {size:,} sites in {BATCH_DIR} (seed {args.seed})")


def run_batch(number: int, steps: str, options: list[str]) -> None:
    from pipeline.main import run

    started = datetime.now(UTC)
    print(f"\n##### {batch_name(number)}: {steps} (start {started:%Y-%m-%d %H:%M} UTC)", flush=True)
    run(["--firms", str(batch_csv(number)), "--folder", batch_name(number), "--steps", steps, *options])
    print(f"##### {batch_name(number)}: done in {(datetime.now(UTC) - started).total_seconds() / 60:.0f} min")


def crawl(args) -> None:
    steps = "crawl,retry,summary,clean,chunk" if args.retry else "crawl,summary,clean,chunk"
    options = ["--workers", str(args.workers), "--browser-workers", str(args.browser_workers)]
    for number in batch_numbers(args.only):
        if marker(number, "crawled").exists():
            print(f"{batch_name(number)}: already crawled, skipped")
            continue
        run_batch(number, steps, options)
        marker(number, "crawled").touch()


def wait_for_balance(minimum: float, seconds: int) -> None:
    while True:
        try:
            with make_client() as client:
                balance = balance_usd(client)
        except httpx.HTTPError as error:
            print(f"could not read the DeepSeek balance ({type(error).__name__}); continuing", flush=True)
            return
        if balance is None:
            print("no USD balance found on the DeepSeek account; continuing", flush=True)
            return
        if balance >= minimum:
            print(f"DeepSeek balance ${balance:.2f}", flush=True)
            return
        print(f"DeepSeek balance ${balance:.2f}, below ${minimum:.2f}: top up; waiting", flush=True)
        time.sleep(seconds)


def wait_off_peak(seconds: int) -> None:
    while is_peak(datetime.now(UTC)):
        print(f"{datetime.now(UTC):%H:%M} UTC is peak; waiting", flush=True)
        time.sleep(seconds)


def llm(args) -> None:
    options = ["--llm-workers", str(args.llm_workers), "--model", args.model, "--b2c", args.b2c]
    for number in batch_numbers(args.only):
        todo = [step for step in args.steps if not marker(number, step).exists()]
        if not todo:
            print(f"{batch_name(number)}: {', '.join(args.steps)} already done, skipped")
            continue
        while not marker(number, "crawled").exists():
            print(f"{batch_name(number)}: waiting for the crawl", flush=True)
            time.sleep(args.wait)
        for step in todo:
            if step == "claims" and not marker(number, "b2c").exists():
                raise SystemExit(f"{batch_name(number)}: claims need the B2C check first; run with --steps b2c,claims")
            wait_for_balance(args.min_balance, args.wait)
            wait_off_peak(args.wait)
            run_batch(number, step, options)
            marker(number, step).touch()


def main(argv: list[str] | None = None) -> None:
    args = batch_parser().parse_args(argv)
    {"split": split, "crawl": crawl, "llm": llm}[args.command](args)
