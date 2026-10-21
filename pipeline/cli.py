import argparse
from pathlib import Path


def add_workers(parser: argparse.ArgumentParser, default: int = 1) -> None:
    parser.add_argument("--workers", type=int, default=default, help="number of sites handled at the same time")


def add_force(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--force", action="store_true", help="redo and overwrite results already saved")


def add_folder(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("folder", nargs="?", type=Path, help="crawl folder (default: latest)")


def add_firms(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--firms", type=Path, help="only use the domains in this CSV")


def crawler_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Crawl websites and save one file per site.")
    parser.add_argument(
        "inputs", nargs="*", default=["fornomoreno.it"], help="domains, or CSV files with a domain column"
    )
    add_workers(parser)
    add_force(parser)
    return parser.parse_args()


def retry_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Retry failed and thin sites of a crawl.")
    add_folder(parser)
    add_firms(parser)
    add_workers(parser)
    return parser.parse_args()


def orbis_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the firm list from the Orbis export.")
    parser.add_argument(
        "--b2c-sectors-only", action="store_true", help="keep only firms in the B2C sector list (sectors.yaml)"
    )
    parser.add_argument(
        "--drop-shared-domains",
        action="store_true",
        help="drop firms whose website is shared with other firms, instead of keeping one per website",
    )
    return parser.parse_args()


def clean_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Clean the page text of a crawl for the LLM.")
    add_folder(parser)
    add_firms(parser)
    return parser.parse_args()


def chunk_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Split cleaned pages into chunks for the LLM.")
    parser.add_argument("folder", nargs="?", type=Path, help="cleaned folder (default: latest)")
    add_firms(parser)
    return parser.parse_args()


def b2c_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Ask the LLM whether each firm sells to consumers.")
    parser.add_argument("folder", nargs="?", type=Path, help="cleaned folder (default: latest)")
    add_firms(parser)
    add_workers(parser)
    parser.add_argument("--model", default="deepseek-v4-pro", help="DeepSeek model")
    return parser.parse_args()
