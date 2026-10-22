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
    return parser
