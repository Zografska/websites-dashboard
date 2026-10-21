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
