# Pipeline

Python scripts that build the data behind the dashboard: they select Italian consumer-facing firms from an Orbis export, crawl their websites, split the text into sentences and flag sentences with green keywords.

All input and output data lives in `data/` at the repo root, which is git-ignored. Nothing in `data/` is ever committed.

## Setup

Python 3.13.

```
python3 -m venv pipeline/.venv
pipeline/.venv/bin/pip install -r pipeline/requirements.txt
pipeline/.venv/bin/pre-commit install
```

The pre-commit hooks run ruff on `pipeline/` and block data files, CSVs, large files, private keys and `.env` files from being committed.

## Steps

Run each script from the repo root with `pipeline/.venv/bin/python`.

| Step | Script | Input | Output |
|---|---|---|---|
| 1. Firm list | `orbis_filter.py` | `data/orbis/ORBIS_Italia_allsectors.csv` | `data/firms_filtered.csv`, `data/firms_filtered_funnel.csv` |
| 2. Crawl | `crawler.py <domains or csv>` | domains, or a CSV with a `domain` column | `data/crawl/<date>/<domain>.json.gz` |
| 3. Crawl summary | `crawl_summary.py [firms csv] [crawl folder]` | the CSV used for the crawl | `data/crawl/summary*.csv` and a printed report |
| 4. Sentences | `sentences.py [firms csv]` | saved crawl files | `data/sentences/<date>.csv.gz` |
| 5. Keywords | `keywords.py [sentences csv]` | sentence table | `data/candidates/<date>.csv.gz` |

### 1. Firm list (`orbis_filter.py`)

Keeps firms with a usable website (drops social media, directories, hosting and parked domains), keeps consumer-facing sectors by ATECO code (`sectors.yaml`), keeps one firm per website (highest revenue) and flags micro firms (fewer than 10 employees and revenue up to €2M).

### 2. Crawl (`crawler.py`)

For each domain: fetches the homepage (https/http, with and without `www.`), follows server, meta-refresh and script redirects, records robots.txt, picks up to 5 subpages by scoring link addresses and labels for sustainability, values and about-us words (Italian, English, German), and fetches them one second apart. Each site gets a status:

- `ok`: homepage and subpages read
- `partial`: some subpages failed
- `thin`: homepage readable but almost empty (challenge page, parked or blank, age gate, Flash, likely JavaScript, little text)
- `failed`: no homepage (dns, timeout, ssl, blocked, http error)

Each saved file holds the status, final address, an off-domain flag, the user agent used, and every page's address, why it was chosen, raw HTML and text. Sites already saved are skipped, so an interrupted run can be resumed.

### 4. Sentences (`sentences.py`)

Splits each page's text at line breaks and with `pysbd` (Italian rules). Each sentence keeps its page address and the sentence before and after as context. Drops sentences under 2 words and cookie or privacy text, keeps each sentence once per firm (the copy on the best-scored subpage) and keeps at most 300 sentences per page.

### 5. Keywords (`keywords.py`)

Matches the keyword list in `keywords.yaml` (grouped, Italian and English). A keyword without `*` matches whole words only. With `*`, it matches any word starting with it. Adds the matched keywords and their groups to each sentence and saves the matched sentences only.

## Claim IDs

Duplicate sentences are detected with the same text normalization the dashboard uses for claim IDs (see the main README and `IMPLEMENTATION_PLAN.md`, Appendix A).
