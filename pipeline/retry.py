import multiprocessing
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict
from datetime import datetime
from pathlib import Path

import pandas as pd

from browser import Browser, BrowserFetcher
from cli import retry_args
from crawler import CRAWL_DIR, crawl_site, load_result, make_client, save_result
from runlog import RunLog

SLOW_TIMEOUT_SECONDS = 30
BROWSER_SITE_LIMIT_SECONDS = 180
BROWSER_REASONS = ("blocked", "challenge page", "little text", "http 999")
SLOW_REASONS = ("timeout", "http 5", "reset", "ssl", "dns", "RemoteProtocolError", "ReadError", "ConnectError")
RANK = {"ok": 3, "partial": 2, "thin": 1, "failed": 0}


def retry_method(result: dict) -> str | None:
    reason = result.get("reason") or ""
    if result["status"] in ("ok", "partial"):
        return None
    if any(word in reason for word in BROWSER_REASONS):
        return "browser"
    if result["status"] == "failed" and any(word in reason for word in SLOW_REASONS):
        return "httpx_slow"
    return None


def attempt_summary(result: dict, method: str) -> dict:
    return {"method": method, "at": result["crawled_at"], "status": result["status"], "reason": result["reason"]}


def keep_best(old: dict, new: dict) -> dict:
    best = new if RANK[new["status"]] > RANK[old["status"]] else old
    attempts = old.get("attempts") or [attempt_summary(old, old.get("fetched_with", "httpx"))]
    return best | {"attempts": attempts + [attempt_summary(new, new["fetched_with"])]}


def save_dict(result: dict, folder: Path) -> None:
    from crawler import Page, SiteResult

    pages = [Page(**page) for page in result["pages"]]
    save_result(SiteResult(**(result | {"pages": pages})), folder)


def browser_crawl(domain: str) -> dict:
    with Browser() as context:
        return asdict(crawl_site(context, domain, BrowserFetcher))


def browser_crawl_limited(domain: str) -> dict:
    pool = multiprocessing.Pool(1)
    try:
        return pool.apply_async(browser_crawl, (domain,)).get(timeout=BROWSER_SITE_LIMIT_SECONDS)
    except multiprocessing.TimeoutError:
        now = datetime.now().isoformat(timespec="seconds")
        return {"crawled_at": now, "status": "failed", "reason": "browser timeout", "fetched_with": "browser"}
    finally:
        pool.terminate()


def retry_site(domain: str, folder: Path, slow_client) -> dict:
    old = load_result(folder / f"{domain}.json.gz")
    method = retry_method(old)
    if method == "httpx_slow":
        new = asdict(crawl_site(slow_client, domain)) | {"fetched_with": "httpx_slow"}
        old = keep_best(old, new)
        method = retry_method(old)
        if old["status"] == "failed" and "timeout" in (old["reason"] or ""):
            method = "browser"
    if method == "browser":
        old = keep_best(old, browser_crawl_limited(domain))
    return old


def retry_and_save(domain: str, folder: Path, slow_client) -> tuple[str, str]:
    before = load_result(folder / f"{domain}.json.gz")
    best = retry_site(domain, folder, slow_client)
    save_dict(best, folder)
    chars = sum(len(page["text"]) for page in best["pages"])
    return best["status"], (
        f"{domain:32} {before['status']:>6} -> {best['status']:<7} "
        f"{best.get('fetched_with', 'httpx'):<10} chars={chars:>7,}  {best['reason'] or ''}"
    )


if __name__ == "__main__":
    args = retry_args()
    folder = args.folder or sorted(CRAWL_DIR.glob("20*"))[-1]
    domains = pd.read_csv(args.firms)["domain"].tolist() if args.firms else None
    paths = [folder / f"{d}.json.gz" for d in domains] if domains else sorted(folder.glob("*.json.gz"))
    todo = [p.name.removesuffix(".json.gz") for p in paths if p.exists() and retry_method(load_result(p))]
    with (
        RunLog(folder, "retry", vars(args), len(todo)) as log,
        make_client(timeout=SLOW_TIMEOUT_SECONDS, verify=False) as slow_client,
        ThreadPoolExecutor(args.workers) as pool,
    ):
        jobs = [pool.submit(retry_and_save, domain, folder, slow_client) for domain in todo]
        for job in as_completed(jobs):
            log.record(*job.result())
