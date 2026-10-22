# Pipeline

Python code that builds the data behind the dashboard: it selects Italian firms from an Orbis export, crawls their websites, prepares the page text, and uses an LLM (DeepSeek) to check whether each firm sells to consumers and to find and classify its environmental claims.

All input and output data lives in `data/` at the repo root, which is git-ignored. Nothing in `data/` is ever committed.

## Setup

Python 3.13.

```
python3 -m venv pipeline/.venv
pipeline/.venv/bin/pip install -r pipeline/requirements.txt
pipeline/.venv/bin/python -m playwright install chromium
pipeline/.venv/bin/pre-commit install
```

The LLM steps read `DEEPSEEK_API_KEY` from `.env` at the repo root (git-ignored). The pre-commit hooks run ruff on `pipeline/` and block data files, CSVs, large files, private keys and `.env` files from being committed.

## Layout

```
pipeline/
├── common/          shared helpers: paths, command-line options, run logs, text rules
├── firms/           step 1: firm list from Orbis
├── crawl/           step 2: crawling, retries, crawl summary
├── text/            step 3: cleaning and chunking page text
└── llm/             step 4: DeepSeek client, B2C check, claim extraction, prompts
```

## Steps

Run everything from the repo root as a module, for example `pipeline/.venv/bin/python -m pipeline.crawl.crawler --help`. Every script lists its options with `--help`.

| Step | Command (`python -m …`) | Input | Output |
|---|---|---|---|
| 1. Firm list | `pipeline.firms.orbis_filter [--b2c-sectors-only] [--drop-shared-domains]` | `data/orbis/ORBIS_Italia_allsectors.csv` | `data/firms_filtered.csv`, `data/firms_filtered_funnel.csv` |
| 2a. Crawl | `pipeline.crawl.crawler <domains or csv> [--workers N] [--force]` | domains, or a CSV with a `domain` column | `data/crawl/<date>/<domain>.json.gz` |
| 2b. Retry | `pipeline.crawl.retry [crawl folder] [--firms csv] [--workers N]` | a crawl folder | the same files, improved, with every attempt recorded |
| 2c. Summary | `pipeline.crawl.summary [firms csv] [crawl folder]` | a crawl folder | `data/crawl/summary*.csv` and a printed report |
| 3a. Clean | `pipeline.text.clean [crawl folder] [--firms csv]` | a crawl folder | `data/clean/<date>/<domain>.json.gz` |
| 3b. Chunk | `pipeline.text.chunk [clean folder] [--firms csv]` | a clean folder | `data/chunks/<date>.jsonl` |
| 4a. B2C check | `pipeline.llm.b2c [clean folder] [--firms csv] [--workers N] [--model M]` | a clean folder | `data/b2c/<model>/<date>.jsonl` |
| 4b. Claims | `pipeline.llm.claims [chunks file] [--firms csv] [--workers N] [--model M]` | a chunks file | `data/claims/<model>/<date>.jsonl` |

Crawl, retry and the LLM steps also write a log and a live JSON status per run in a `_logs` folder next to their output. Runs can be interrupted and started again: work already saved is skipped.

### 1. Firm list

Keeps firms with a usable website (drops social media, directories, hosting and parked domains) and one firm per website (highest revenue), and flags micro firms (fewer than 10 employees and revenue up to €2M) and firms in consumer-facing sectors (`firms/sectors.yaml`, column `in_b2c_sector`). `--b2c-sectors-only` keeps only those sectors; `--drop-shared-domains` drops firms that share a website instead of keeping one.

### 2. Crawl

For each domain: fetches the homepage (https/http, with and without `www.`), follows server, meta-refresh and script redirects, records robots.txt, follows the Italian version of language-choice pages and the links of near-empty gateway pages, picks up to 5 subpages by scoring link addresses and labels for sustainability, values and about-us words (Italian, English, German), and fetches them one second apart per site. Each site gets a status:

- `ok`: homepage and subpages read
- `partial`: some subpages failed
- `thin`: homepage readable but almost empty (challenge page, parked or blank, age gate, Flash, likely JavaScript, little text)
- `failed`: no homepage (dns, timeout, ssl, blocked, http error)

The retry pass tries timeouts and server errors again with a longer timeout, and blocked, challenge, JavaScript and near-empty sites with a headless browser (`crawl/browser.py`), keeping the best result.

### 3. Text

`clean` fixes broken characters, removes blocks repeated across a site's pages and short cookie or privacy blocks; it never changes words. `chunk` splits the cleaned pages into pieces of up to about 3,000 tokens at block boundaries, with a small overlap, and keeps at most 8 chunks per site.

### 4. LLM

`llm/client.py` sends one request to DeepSeek (temperature 0, JSON answers, thinking off), checks the answer against the prompt's schema, retries once if it is invalid, and records model, tokens, cost and time. The prompts are in `llm/prompts/`.

- **B2C check:** one call per firm on its cleaned text; answers `yes`, `mixed`, `no` or `unclear` with a quote from the page as evidence. It is stored as a flag; no firm is dropped.
- **Claims:** one call per chunk; returns every environmental claim on the page, quoted word for word, with its triggers, label, confidence and a short reason. The code checks that each quote is on the page and sets the category, gray zone and context snippet.

## Claim IDs

Duplicate claims are detected with the same text normalization the dashboard uses for claim IDs (see the main README and `IMPLEMENTATION_PLAN.md`, Appendix A), in `common/text.py`.
