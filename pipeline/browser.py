import time
from dataclasses import dataclass, field

import httpx
from playwright.sync_api import BrowserContext, Error, Page, sync_playwright
from playwright.sync_api import TimeoutError as PlaywrightTimeout

from crawler import CHALLENGE_WORDS, DELAY_SECONDS

PAGE_TIMEOUT_MS = 30_000
SETTLE_SECONDS = 2
CHALLENGE_WAIT_SECONDS = 15
RAW_SUFFIXES = (".txt", ".xml", ".xml.gz")


@dataclass
class BrowserResponse:
    url: str
    status_code: int
    headers: dict
    text: str
    content: bytes
    history: list = field(default_factory=list)


def looks_like_challenge(html: str) -> bool:
    lowered = html.lower()
    return len(lowered) < 20_000 and any(word in lowered for word in CHALLENGE_WORDS)


def settle(page: Page) -> None:
    time.sleep(SETTLE_SECONDS)
    deadline = time.monotonic() + CHALLENGE_WAIT_SECONDS
    while looks_like_challenge(page.content()) and time.monotonic() < deadline:
        time.sleep(1)


class BrowserFetcher:
    method = "browser"

    def __init__(self, context: BrowserContext):
        self.context = context
        self.user_agent = "browser"
        self.last_request = 0.0

    def get(self, url: str) -> BrowserResponse:
        wait = self.last_request + DELAY_SECONDS - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        try:
            return self.raw(url) if url.lower().endswith(RAW_SUFFIXES) else self.render(url)
        except PlaywrightTimeout as error:
            raise httpx.TimeoutException(str(error)) from error
        except Error as error:
            raise httpx.ConnectError(str(error)) from error
        finally:
            self.last_request = time.monotonic()

    def raw(self, url: str) -> BrowserResponse:
        response = self.context.request.get(url, timeout=PAGE_TIMEOUT_MS)
        body = response.body()
        return BrowserResponse(response.url, response.status, response.headers, body.decode(errors="replace"), body)

    def render(self, url: str) -> BrowserResponse:
        page = self.context.new_page()
        documents = []
        page.on(
            "response",
            lambda r: (
                documents.append(r) if r.request.resource_type == "document" and r.frame == page.main_frame else None
            ),
        )
        try:
            page.goto(url, wait_until="load", timeout=PAGE_TIMEOUT_MS)
            settle(page)
            html = page.content()
            final = documents[-1] if documents else None
            history = documents[:-1]
            status = final.status if final else 0
            headers = {"content-type": final.headers.get("content-type", "text/html") if final else "text/html"}
            final_url = page.url if page.url.startswith("http") else (final.url if final else url)
            return BrowserResponse(final_url, status, headers, html, html.encode(), history)
        finally:
            page.close()


class Browser:
    def __enter__(self) -> BrowserContext:
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(headless=True)
        probe = self.browser.new_page()
        user_agent = probe.evaluate("navigator.userAgent").replace("HeadlessChrome", "Chrome")
        probe.close()
        self.context = self.browser.new_context(user_agent=user_agent, locale="it-IT")
        return self.context

    def __exit__(self, *exc) -> None:
        self.browser.close()
        self.playwright.stop()
