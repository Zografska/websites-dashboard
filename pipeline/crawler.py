import re
import sys
import urllib.robotparser
from dataclasses import dataclass, field
from urllib.parse import unquote, urljoin, urlparse

import httpx
from bs4 import BeautifulSoup

USER_AGENT = "Mozilla/5.0 (compatible; UniMi-research-crawler/0.2; ECGT website study)"
TIMEOUT_SECONDS = 15

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


def fetch(client: httpx.Client, url: str) -> httpx.Response:
    return client.get(url)


def read_robots(client: httpx.Client, base_url: str) -> Robots:
    parser = urllib.robotparser.RobotFileParser()
    try:
        response = fetch(client, urljoin(base_url, "/robots.txt"))
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


def sitemap_urls(client: httpx.Client, sitemap_url: str, depth: int = 0) -> list[str]:
    try:
        response = fetch(client, sitemap_url)
    except httpx.HTTPError:
        return []
    if response.status_code != 200:
        return []
    soup = BeautifulSoup(response.content, "xml")
    locs = [loc.get_text(strip=True) for loc in soup.find_all("loc")]
    if soup.find("sitemapindex") and depth == 0:
        children = sorted(locs, key=lambda u: not re.search(r"page|pagin", u, re.I))[:3]
        return [url for child in children for url in sitemap_urls(client, child, depth + 1)]
    return locs


def sitemap_links(client: httpx.Client, home_url: str, robots: Robots) -> list[Candidate]:
    sitemaps = robots.sitemaps or [urljoin(home_url, "/sitemap.xml")]
    candidates = []
    for sitemap in sitemaps[:2]:
        for url in sitemap_urls(client, sitemap):
            url = clean_url(url, home_url)
            if url:
                candidate = score_link(url, "", "sitemap")
                if candidate:
                    candidates.append(candidate)
    return best_candidates(candidates)


def common_path_links(home_url: str) -> list[Candidate]:
    return [Candidate(urljoin(home_url, path), 0, True, "common path guess") for path in COMMON_PATHS]


def find_subpages(client: httpx.Client, html: str, home_url: str, robots: Robots) -> list[Candidate]:
    return homepage_links(html, home_url) or sitemap_links(client, home_url, robots) or common_path_links(home_url)


def html_to_text(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(INVISIBLE_TAGS):
        tag.decompose()
    for tag in soup(BLOCK_TAGS):
        tag.insert_before("\n")
        tag.insert_after("\n")
    lines = (re.sub(r"\s+", " ", line).strip() for line in soup.get_text().split("\n"))
    return "\n".join(line for line in lines if line)


if __name__ == "__main__":
    domain = sys.argv[1] if len(sys.argv) > 1 else "fornomoreno.it"
    with make_client() as client:
        response = fetch(client, f"https://{domain}/")
        home = str(response.url)
        robots = read_robots(client, home)
        subpages = find_subpages(client, response.text, home, robots)
    print(f"requested:    https://{domain}/")
    print(f"final url:    {home}")
    print(f"status:       {response.status_code}")
    print(f"content type: {response.headers.get('content-type')}")
    print(f"size:         {len(response.text):,} characters")
    print(f"redirects:    {[str(r.url) for r in response.history]}")
    print()
    print(f"robots.txt found:     {robots.found}")
    print(f"homepage disallowed:  {robots.disallows(home)}")
    print(f"sitemaps:             {robots.sitemaps}")
    print()
    for candidate in subpages:
        print(f"{candidate.score}  {candidate.url}\n   {candidate.reason}")
