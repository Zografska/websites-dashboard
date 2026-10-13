import re
import sys
import time
import urllib.robotparser
from dataclasses import dataclass, field
from urllib.parse import unquote, urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

USER_AGENT = "Mozilla/5.0 (compatible; UniMi-research-crawler/0.2; ECGT website study)"
FALLBACK_USER_AGENT = "Mozilla/5.0"
TIMEOUT_SECONDS = 15
DELAY_SECONDS = 1.0
THIN_CHARS = 500
MAX_META_REFRESH = 3
CHALLENGE_WORDS = [
    "just a moment",
    "verify you are human",
    "verifica di essere un essere umano",
    "attention required",
    "checking your browser",
    "cf-chl",
    "g-recaptcha",
    "h-captcha",
    "access denied",
    "sgcaptcha",
]
PARKED_WORDS = [
    "questo dominio è già registrato",
    "this domain is already taken",
    "dominio in vendita",
    "domain is for sale",
    "this domain may be for sale",
    "sito in costruzione",
    "under construction",
]
AGE_GATE_WORDS = ["maggiore età", "maggiorenne", "18 anni", "hai l'età", "legal drinking age", "are you 18", "over 18"]

INVISIBLE_TAGS = ["script", "style", "noscript", "svg", "iframe", "template", "head", "canvas", "map"]
BLOCK_TAGS = (
    "address article aside blockquote br button caption dd details div dl dt fieldset "
    "figcaption figure footer form h1 h2 h3 h4 h5 h6 header hr label legend li main nav ol "
    "option p pre section select summary table tbody td tfoot th thead tr ul"
).split()

MAX_SUBPAGES = 5
LINK_WORDS = {
    3: [
        "sostenib",
        "sustainab",
        "nachhaltig",
        "ambient",
        "environment",
        "umwelt",
        "green",
        r"\beco\b",
        "esg",
        "csr",
        "bilancio sociale",
        "impatto",
        "impact",
        "clima",
        "climate",
        "klima",
        "carbon",
    ],
    2: [
        "responsabil",
        "responsib",
        "verantwortung",
        "impegn",
        "commitment",
        "valori",
        "values",
        "werte",
        "certific",
        "zertifi",
        "qualit",
        "filosofia",
        "philosophy",
        "natura",
        "nature",
    ],
    1: [
        "chi siamo",
        "chisiamo",
        "about",
        "uber uns",
        "ueber uns",
        "über uns",
        "azienda",
        "company",
        "unternehmen",
        "storia",
        "history",
        "geschichte",
        "mission",
    ],
}
EXCLUDED_WORDS = [
    "contatt",
    "contact",
    "kontakt",
    "privacy",
    "cookie",
    "datenschutz",
    "impressum",
    "note legali",
    "termini",
    "terms",
    "condizioni",
    "carrello",
    "cart",
    "warenkorb",
    "checkout",
    "login",
    "account",
    "registr",
    "wp admin",
    "wp login",
    "newsletter",
    "prodott",
    "product",
    "produkt",
    "shop",
    "negozio",
]
EXCLUDED_FILES = r"\.(pdf|jpe?g|png|gif|webp|svg|zip|docx?|xlsx?|mp4|mp3)$"
OTHER_LANGUAGES = ["en", "de", "fr", "es", "pt", "nl", "ru", "zh", "ja", "pl", "cs", "ar"]
COMMON_PATHS = ["/chi-siamo", "/sostenibilita", "/azienda", "/about", "/about-us"]


@dataclass
class Robots:
    found: bool
    parser: urllib.robotparser.RobotFileParser
    sitemaps: list[str] = field(default_factory=list)

    def disallows(self, url: str) -> bool:
        return self.found and not self.parser.can_fetch(USER_AGENT, url)


def make_client() -> httpx.Client:
    return httpx.Client(
        headers={"User-Agent": USER_AGENT, "Accept-Language": "it-IT,it;q=0.9,en;q=0.5"},
        timeout=TIMEOUT_SECONDS,
        follow_redirects=True,
    )


@dataclass
class Fetcher:
    client: httpx.Client
    user_agent: str = USER_AGENT
    last_request: float = 0.0

    def get(self, url: str) -> httpx.Response:
        wait = self.last_request + DELAY_SECONDS - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        try:
            response = self.client.get(url, headers={"User-Agent": self.user_agent})
        except httpx.RemoteProtocolError:
            time.sleep(DELAY_SECONDS)
            response = self.client.get(url, headers={"User-Agent": self.user_agent})
        self.last_request = time.monotonic()
        return response


def fetch(fetcher: Fetcher, url: str) -> httpx.Response:
    return fetcher.get(url)


def read_robots(fetcher: Fetcher, base_url: str) -> Robots:
    parser = urllib.robotparser.RobotFileParser()
    try:
        response = fetch(fetcher, urljoin(base_url, "/robots.txt"))
    except httpx.HTTPError:
        return Robots(found=False, parser=parser)
    if response.status_code != 200 or "html" in response.headers.get("content-type", ""):
        return Robots(found=False, parser=parser)
    lines = response.text.splitlines()
    parser.parse(lines)
    sitemaps = [line.split(":", 1)[1].strip() for line in lines if line.lower().startswith("sitemap:")]
    return Robots(found=True, parser=parser, sitemaps=sitemaps)


@dataclass
class Candidate:
    url: str
    score: int
    is_italian: bool
    reason: str


def words_of(text: str) -> str:
    return re.sub(r"[-_/.+%]+", " ", unquote(text).lower())


def match_words(text: str, words: list[str]) -> list[str]:
    return [word for word in words if re.search(word, text)]


def same_site(url: str, home_url: str) -> bool:
    host = urlparse(url).netloc.removeprefix("www.")
    return host == urlparse(home_url).netloc.removeprefix("www.")


def is_italian(url: str) -> bool:
    first = urlparse(url).path.strip("/").split("/")[0].lower()
    return first.split("-")[0] not in OTHER_LANGUAGES


def score_link(url: str, link_text: str, source: str) -> Candidate | None:
    path = words_of(urlparse(url).path)
    text = words_of(link_text)
    if match_words(path, EXCLUDED_WORDS) or match_words(text, EXCLUDED_WORDS):
        return None
    for score, words in LINK_WORDS.items():
        in_path, in_text = match_words(path, words), match_words(text, words)
        if in_path or in_text:
            found = [f"'{w}' in url" for w in in_path] + [f"'{w}' in text" for w in in_text]
            return Candidate(url, score, is_italian(url), f"{source}: " + ", ".join(found).replace("\\b", ""))
    return None


def clean_url(href: str, base_url: str) -> str | None:
    url = urljoin(base_url, href.strip()).split("#")[0]
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or re.search(EXCLUDED_FILES, parsed.path, re.I):
        return None
    if not same_site(url, base_url) or url.rstrip("/") == base_url.rstrip("/"):
        return None
    return url


def best_candidates(candidates: list[Candidate]) -> list[Candidate]:
    best = {}
    for candidate in candidates:
        key = candidate.url.rstrip("/")
        if key not in best or candidate.score > best[key].score:
            best[key] = candidate
    ranked = sorted(best.values(), key=lambda c: (-c.score, not c.is_italian, len(c.url)))
    return ranked[:MAX_SUBPAGES]


def homepage_links(html: str, home_url: str) -> list[Candidate]:
    soup = BeautifulSoup(html, "lxml")
    candidates = []
    for link in soup.find_all("a", href=True):
        url = clean_url(link["href"], home_url)
        if url:
            text = link.get_text(" ", strip=True) or link.get("title", "")
            candidate = score_link(url, text, "homepage link")
            if candidate:
                candidates.append(candidate)
    return best_candidates(candidates)


def sitemap_urls(fetcher: Fetcher, sitemap_url: str, depth: int = 0) -> list[str]:
    try:
        response = fetch(fetcher, sitemap_url)
    except httpx.HTTPError:
        return []
    if response.status_code != 200:
        return []
    soup = BeautifulSoup(response.content, "xml")
    locs = [loc.get_text(strip=True) for loc in soup.find_all("loc")]
    if soup.find("sitemapindex") and depth == 0:
        children = sorted(locs, key=lambda u: not re.search(r"page|pagin", u, re.I))[:3]
        return [url for child in children for url in sitemap_urls(fetcher, child, depth + 1)]
    return locs


def sitemap_links(fetcher: Fetcher, home_url: str, robots: Robots) -> list[Candidate]:
    sitemaps = robots.sitemaps or [urljoin(home_url, "/sitemap.xml")]
    candidates = []
    for sitemap in sitemaps[:2]:
        for url in sitemap_urls(fetcher, sitemap):
            url = clean_url(url, home_url)
            if url:
                candidate = score_link(url, "", "sitemap")
                if candidate:
                    candidates.append(candidate)
    return best_candidates(candidates)


def common_path_links(home_url: str) -> list[Candidate]:
    return [Candidate(urljoin(home_url, path), 0, True, "common path guess") for path in COMMON_PATHS]


def find_subpages(fetcher: Fetcher, html: str, home_url: str, robots: Robots) -> list[Candidate]:
    return homepage_links(html, home_url) or sitemap_links(fetcher, home_url, robots) or common_path_links(home_url)


def html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(INVISIBLE_TAGS):
        tag.decompose()
    for tag in soup(BLOCK_TAGS):
        tag.insert_before("\n")
        tag.insert_after("\n")
    lines = (re.sub(r"\s+", " ", line).strip() for line in soup.get_text().split("\n"))
    return "\n".join(line for line in lines if line)


@dataclass
class Page:
    url: str
    chosen_because: str
    final_url: str | None = None
    status_code: int | None = None
    robots_disallowed: bool = False
    html: str = ""
    text: str = ""
    error: str | None = None


@dataclass
class SiteResult:
    domain: str
    status: str = "failed"
    reason: str | None = None
    home_url: str | None = None
    redirects: list[str] = field(default_factory=list)
    robots_found: bool = False
    user_agent: str = USER_AGENT
    pages: list[Page] = field(default_factory=list)
    seconds: float = 0.0


def error_reason(error: Exception) -> str:
    message = str(error).lower()
    if isinstance(error, httpx.TimeoutException):
        return "timeout"
    if isinstance(error, httpx.TooManyRedirects):
        return "redirect loop"
    if "certificate" in message or "ssl" in message:
        return "ssl"
    if "nodename" in message or "name or service" in message or "getaddrinfo" in message:
        return "dns"
    if "refused" in message:
        return "refused"
    if "reset by peer" in message:
        return "reset"
    return type(error).__name__


def meta_refresh_url(html: str, base_url: str) -> str | None:
    soup = BeautifulSoup(html, "lxml")
    meta = soup.find("meta", attrs={"http-equiv": re.compile("^refresh$", re.I)})
    if not meta:
        return None
    match = re.search(r"^\s*\d*\s*;\s*(?:url\s*=\s*)?['\"]?([^'\"]+)", meta.get("content", ""), re.I)
    return urljoin(base_url, match.group(1).strip()) if match else None


def fetch_page(fetcher: Fetcher, page: Page, redirects: list[str] | None = None) -> Page:
    url = page.url
    for _ in range(MAX_META_REFRESH + 1):
        try:
            response = fetch(fetcher, url)
        except httpx.HTTPError as error:
            page.error = error_reason(error)
            return page
        if redirects is not None:
            redirects.extend(str(r.url) for r in response.history)
        page.final_url, page.status_code = str(response.url), response.status_code
        content_type = response.headers.get("content-type", "")
        if "html" not in content_type:
            page.error = f"not html ({content_type.split(';')[0] or 'unknown'})"
            return page
        page.html = response.text
        page.text = html_to_text(page.html)
        refresh = meta_refresh_url(page.html, page.final_url)
        if is_challenge(page) or not refresh or refresh.rstrip("/") == page.final_url.rstrip("/"):
            break
        if redirects is not None:
            redirects.append(page.final_url)
        url = refresh
    if response.status_code >= 400 and not is_challenge(page):
        blocked = response.status_code in (401, 403, 429)
        page.error = f"blocked (http {response.status_code})" if blocked else f"http {response.status_code}"
    return page


def is_challenge(page: Page) -> bool:
    return len(page.text) < THIN_CHARS and any(word in page.html.lower() for word in CHALLENGE_WORDS)


def thin_reason(page: Page) -> str | None:
    if is_challenge(page):
        return "challenge page"
    if len(page.text) >= THIN_CHARS:
        return None
    if any(word in page.text.lower() for word in PARKED_WORDS):
        return "parked or under construction"
    if any(word in page.text.lower() for word in AGE_GATE_WORDS):
        return "age gate"
    if page.html.lower().count("<script") >= 3:
        return "little text, likely javascript"
    return "little text"


def fetch_homepage(fetcher: Fetcher, result: SiteResult) -> Page | None:
    errors = []
    for scheme in ("https", "http"):
        for host in (result.domain, "www." + result.domain):
            page = fetch_page(fetcher, Page(f"{scheme}://{host}/", "homepage"), result.redirects)
            if not page.error:
                return page
            result.redirects.clear()
            errors.append(page.error)
            if page.error == "timeout":
                result.reason = "timeout"
                return None
    result.reason = ", ".join(dict.fromkeys(errors))
    return None


def crawl_site(client: httpx.Client, domain: str) -> SiteResult:
    start = time.monotonic()
    fetcher = Fetcher(client)
    result = SiteResult(domain)
    home = fetch_homepage(fetcher, result)
    if not home and result.reason.startswith("blocked"):
        fetcher.user_agent = result.user_agent = FALLBACK_USER_AGENT
        home = fetch_homepage(fetcher, result)
    if home:
        result.home_url = home.final_url
        robots = read_robots(fetcher, result.home_url)
        result.robots_found = robots.found
        home.robots_disallowed = robots.disallows(result.home_url)
        result.pages.append(home)
        result.reason = thin_reason(home)
        if result.reason:
            result.status = "thin"
        else:
            crawl_subpages(fetcher, result, home, robots)
    result.seconds = round(time.monotonic() - start, 1)
    return result


def crawl_subpages(fetcher: Fetcher, result: SiteResult, home: Page, robots: Robots) -> None:
    seen = {home.final_url.rstrip("/")}
    failed = []
    for candidate in find_subpages(fetcher, home.html, result.home_url, robots):
        page = fetch_page(fetcher, Page(candidate.url, candidate.reason))
        page.robots_disallowed = robots.disallows(candidate.url)
        if page.error:
            if candidate.reason != "common path guess":
                failed.append(f"{candidate.url}: {page.error}")
            continue
        if page.final_url.rstrip("/") in seen:
            continue
        seen.add(page.final_url.rstrip("/"))
        result.pages.append(page)
    result.status = "partial" if failed else "ok"
    result.reason = "; ".join(failed) or None


if __name__ == "__main__":
    domains = sys.argv[1:] or ["fornomoreno.it"]
    with make_client() as client:
        for domain in domains:
            result = crawl_site(client, domain)
            chars = sum(len(page.text) for page in result.pages)
            print(
                f"{domain:32} {result.status:8} pages={len(result.pages)} chars={chars:>7,} "
                f"{result.seconds:>5}s  {result.reason or ''}"
                + ("  [fallback user agent]" if result.user_agent == FALLBACK_USER_AGENT else ""),
                flush=True,
            )
