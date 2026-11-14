import argparse
from pathlib import Path

from pipeline.common.paths import DATA_DIR

DEFAULT_MODEL = "deepseek-v4-pro"
SAMPLE_CSV = DATA_DIR / "crawl/sample500.csv"


def add_workers(parser: argparse.ArgumentParser, default: int = 1) -> None:
    parser.add_argument("--workers", type=int, default=default, help="number of items handled at the same time")


def add_force(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--force", action="store_true", help="redo and overwrite results already saved")


def add_folder(parser: argparse.ArgumentParser, help: str = "crawl folder (default: latest)") -> None:
    parser.add_argument("folder", nargs="?", type=Path, help=help)


def add_firms(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--firms", type=Path, help="only use the domains in this CSV")


def add_model(parser: argparse.ArgumentParser, default: str = DEFAULT_MODEL) -> None:
    parser.add_argument("--model", default=default, help="DeepSeek model")


def orbis_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Build the firm list from the Orbis export.", add_help=add_help)
    parser.add_argument(
        "--b2c-sectors-only", action="store_true", help="keep only firms in the B2C sector list (sectors.yaml)"
    )
    parser.add_argument(
        "--drop-shared-domains",
        action="store_true",
        help="drop firms whose website is shared with other firms, instead of keeping one per website",
    )
    return parser


def crawler_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Crawl websites and save one file per site.", add_help=add_help)
    parser.add_argument(
        "inputs", nargs="*", default=["fornomoreno.it"], help="domains, or CSV files with a domain column"
    )
    add_workers(parser)
    add_force(parser)
    parser.add_argument(
        "--folder", help="folder name under data/crawl (default: today's date); reuse a name to resume a crawl"
    )
    return parser


def retry_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Retry failed and thin sites of a crawl.", add_help=add_help)
    add_folder(parser)
    add_firms(parser)
    add_workers(parser)
    return parser


def summary_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Summarize a crawl folder.", add_help=add_help)
    parser.add_argument("firms", nargs="?", type=Path, default=SAMPLE_CSV, help="CSV of the crawled firms")
    add_folder(parser)
    return parser


def clean_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Clean the page text of a crawl for the LLM.", add_help=add_help)
    add_folder(parser)
    add_firms(parser)
    return parser


def chunk_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Split cleaned pages into chunks for the LLM.", add_help=add_help)
    add_folder(parser, "cleaned folder (default: latest)")
    add_firms(parser)
    return parser


def b2c_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Ask the LLM whether each firm sells to consumers.", add_help=add_help)
    add_folder(parser, "cleaned folder (default: latest)")
    add_firms(parser)
    add_workers(parser)
    add_model(parser)
    return parser


def claims_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Extract and classify environmental claims from page chunks.", add_help=add_help
    )
    parser.add_argument("chunks", nargs="?", type=Path, help="chunks file (default: latest)")
    add_firms(parser)
    add_workers(parser)
    add_model(parser)
    parser.add_argument(
        "--prompt",
        type=Path,
        help="prompt file (default: CLAIM_EXTRACTION_PROMPT_v5.md); others write to their own file",
    )
    add_b2c_filter(parser)
    return parser


def add_b2c_filter(parser: argparse.ArgumentParser) -> None:
    parser.add_argument(
        "--b2c",
        help="only firms with these B2C answers in the run's B2C file, comma-separated (e.g. yes,mixed,unclear); "
        "default: all firms",
    )


def export_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Build the review table: claims, LLM unsure items and possible misses per firm.", add_help=add_help
    )
    parser.add_argument("chunks", nargs="?", type=Path, help="chunks file whose results to export (default: latest)")
    add_firms(parser)
    add_model(parser)
    return parser


def master_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Build the complete firm and claim tables of a batch run (data/export).", add_help=add_help
    )
    parser.add_argument("--prefix", default="full", help="batch run name (default: full, i.e. full-01 ... full-17)")
    add_model(parser, "deepseek-flash")
    return parser


def randomize_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Assign C or T2 to the firms with claims, stratified by size and red claims.", add_help=add_help
    )
    parser.add_argument("--seed", type=int, default=20261114, help="random seed, recorded in the output")
    parser.add_argument(
        "--min-stratum", type=int, default=20, help="merge large and very large if any stratum is smaller"
    )
    add_force(parser)
    return parser


def review_sample_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Draw a firm sample from a review table and split it between reviewers.", add_help=add_help
    )
    parser.add_argument("table", type=Path, help="review table CSV written by the export step")
    parser.add_argument("--reviewers", default="Giovanna,Jacopo", help="comma-separated reviewer names")
    parser.add_argument(
        "--compare", type=Path, help="claims file of another prompt; its claims not in the table are added as 'v1 only'"
    )
    parser.add_argument("--rows", type=int, default=170, help="rows each reviewer gets alone")
    parser.add_argument("--shared-rows", type=int, default=60, help="rows every reviewer gets, to measure agreement")
    parser.add_argument("--no-claim-firms", type=int, default=0, help="firms with no claim added as one row each")
    parser.add_argument("--b2c", default="yes,mixed", help="comma-separated B2C answers of the firms to sample")
    parser.add_argument("--seed", type=int, default=2026)
    return parser


RUN_STEPS = ["firms", "crawl", "retry", "summary", "clean", "chunk", "b2c", "claims", "export"]


def run_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m pipeline.main run", description="Run several pipeline steps in order.", add_help=add_help
    )
    parser.add_argument("--firms", type=Path, required=True, help="CSV with a domain column: the firms to process")
    parser.add_argument(
        "--steps",
        type=lambda text: text.split(","),
        default=[step for step in RUN_STEPS if step != "firms"],
        help=f"comma-separated steps, run in this order: {','.join(RUN_STEPS)} (default: all except firms)",
    )
    parser.add_argument("--workers", type=int, default=10, help="sites crawled at the same time")
    parser.add_argument("--browser-workers", type=int, default=4, help="sites retried at the same time")
    parser.add_argument("--llm-workers", type=int, default=8, help="LLM calls at the same time")
    parser.add_argument(
        "--folder",
        help="run name: crawl into data/crawl/NAME and use NAME in every later step (default: each step's latest)",
    )
    add_b2c_filter(parser)
    add_model(parser)
    add_force(parser)
    return parser


BATCH_B2C = "yes,mixed,unclear"


def batch_parser(add_help: bool = True) -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="python -m pipeline.main batch", description="Run the full firm list in batches.", add_help=add_help
    )
    commands = parser.add_subparsers(dest="command", required=True)
    split = commands.add_parser("split", help="shuffle the firm list and write the batch CSVs")
    split.add_argument("--batches", type=int, default=17, help="number of batches")
    split.add_argument("--seed", type=int, default=2031)
    add_force(split)
    crawl = commands.add_parser("crawl", help="crawl, summary, clean and chunk each batch, in order")
    crawl.add_argument("--workers", type=int, default=20, help="sites crawled at the same time")
    crawl.add_argument("--retry", action="store_true", help="also run the retry step")
    crawl.add_argument("--browser-workers", type=int, default=10, help="sites retried at the same time")
    llm = commands.add_parser("llm", help="B2C check and claims for each crawled batch, off-peak only")
    llm.add_argument("--llm-workers", type=int, default=25, help="LLM calls at the same time")
    llm.add_argument(
        "--steps",
        type=lambda text: text.split(","),
        default=["b2c", "claims"],
        choices=[["b2c"], ["claims"], ["b2c", "claims"]],
        help="b2c, claims or b2c,claims (default: b2c,claims); claims need the batch's B2C check",
    )
    llm.add_argument("--b2c", default=BATCH_B2C, help=f"B2C answers sent to the claims step (default: {BATCH_B2C})")
    llm.add_argument("--wait", type=int, default=600, help="seconds between checks for peak hours or new batches")
    llm.add_argument(
        "--min-balance", type=float, default=15.0, help="USD; below this DeepSeek balance a step waits (default: 15)"
    )
    add_model(llm, "deepseek-flash")
    for sub in (crawl, llm):
        sub.add_argument("--only", type=lambda text: [int(n) for n in text.split(",")], help="batch numbers, e.g. 1,2")
    return parser
