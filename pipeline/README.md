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
├── main.py          runs one step or several steps in order
├── common/          shared helpers: paths, command-line options, run logs, text rules, keyword list
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
| 2c. Summary | `pipeline.crawl.summary [firms csv] [crawl folder]` | a crawl folder | `data/crawl/summary_<firms csv>_<crawl folder>.csv` and a printed report |
| 3a. Clean | `pipeline.text.clean [crawl folder] [--firms csv]` | a crawl folder | `data/clean/<date>/<domain>.json.gz` |
| 3b. Chunk | `pipeline.text.chunk [clean folder] [--firms csv]` | a clean folder | `data/chunks/<date>.jsonl` |
| 4a. B2C check | `pipeline.llm.b2c [clean folder] [--firms csv] [--workers N] [--model M]` | a clean folder | `data/b2c/<model>/<date>.jsonl` |
| 4b. Claims | `pipeline.llm.claims [chunks file] [--firms csv] [--workers N] [--model M]` | a chunks file | `data/claims/<model>/<date>.jsonl` |
| 5. Review table | `pipeline.llm.export [chunks file] [--firms csv] [--model M]` | chunks, claim and B2C results | `data/claims/<model>/<date>_review.csv` |
| 6. Review sample | `pipeline.main review-sample <review csv> [--reviewers A,B] [--rows N] [--shared-rows N] [--b2c yes,mixed]` | a review table | `<review csv stem>_sample_<reviewer>.csv` |

Crawl, retry and the LLM steps also write a log and a live JSON status per run in a `_logs` folder next to their output. Runs can be interrupted and started again: work already saved is skipped.

### Running several steps: `pipeline.main`

```
python -m pipeline.main run --firms data/crawl/sample500.csv                        # crawl to claims
python -m pipeline.main run --firms data/pilot20.csv --steps clean,chunk,b2c,claims  # only some steps
python -m pipeline.main crawl data/crawl/sample500.csv --workers 20                 # one step, its own options
```

`run` goes through the chosen steps in the fixed order firms, crawl, retry, summary, clean, chunk, b2c, claims, export (default: all except firms), passing `--firms` to each and using the latest output of the previous step. Options: `--workers` (crawl), `--browser-workers` (retry), `--llm-workers` and `--model` (b2c, claims), `--force` (crawl). `--folder NAME` crawls into `data/crawl/NAME` (instead of today's date) and makes every later step use `NAME`, so a stopped run resumes where it left off. `--b2c yes,mixed,unclear` sends only firms with those B2C answers to the claims step. `python -m pipeline.main <step> --help` shows a step's own options.

### Full firm list in batches: `pipeline.main batch`

```
python -m pipeline.main batch split                    # shuffle the list, write data/crawl/full/batch_01.csv ... batch_17.csv
python -m pipeline.main batch crawl --workers 60       # crawl, summary, clean, chunk each batch into data/crawl/full-NN
python -m pipeline.main batch llm --llm-workers 50     # B2C check, then claims for yes/mixed/unclear firms, off-peak only
python -m pipeline.main batch llm --steps b2c          # only the B2C check; claims later with --steps claims
```

`split` takes every site in the firm list, including those crawled in earlier samples (they are crawled again), and refuses to redraw existing batches without `--force`. `crawl` and `llm` go through the batches in order (`--only 1,2` for some) and mark each finished batch with a file in `data/crawl/full/` (`full-NN.crawled`, `full-NN.b2c`, `full-NN.claims`), so re-running skips finished batches and resumes the current one. `llm` waits for a batch's crawl and for off-peak hours (it checks before each step; a step already running continues into peak hours). Run `crawl` and `llm` in two terminals at the same time. `crawl --retry` adds the slow retry pass. Several `crawl` processes can run at once on different batches (`--only 2,6,10,14`, `--only 3,7,11,15`, …): one process reaches about 2 sites/s whatever the worker count, two reach about 3.6.

LLM calls retry timeouts and HTTP 429/5xx after 5, 30 and 120 s; a call that still fails is logged as skipped and not saved, so a re-run sends it again. When the DeepSeek balance runs out (HTTP 402) the step stops with a message; top up and run the same command again. Before each step `batch llm` checks the balance and waits while it is below `--min-balance` (default $15). Crawl and clean results are written to a temporary file and renamed, so a killed process never leaves a half-written site file.

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
- **Recall check:** the LLM lists only claims, so text it rejected leaves no trace. `common/keywords.py` flags, as possible misses for human review, every line of a chunk that no claim quote covers and that contains either two different words from the keyword list (`common/keywords.yaml`) or one strong word (sostenibile, riciclato, biodegradabile, CO2, net zero, FSC…). It needs no extra LLM call.
- **Review table:** `export` writes one row per item for human review: claims (the same quote on several pages merged, with a page count), claims the LLM returned without a trigger ("llm unsure"), possible misses from the recall check, and one row for each readable firm with nothing found. Each row carries the firm name and the B2C answer. The translation column is filled from `data/claims/translations_en.json` (quote → English) where a translation exists, and left empty otherwise.
- **Review sample:** `review-sample` draws firms with claims (B2C yes or mixed by default) from a review table and splits them between reviewers: per firm all claims up to 10, its llm unsure rows and up to 3 possible misses; a first block of firms goes to every reviewer to measure agreement. Each row gets an `item_id` (domain + 6 characters of the sha256 of the normalized quote, as in the dashboard's claim ID) to join the answers back to the data. The seed is fixed, so the sample can be rebuilt.

## Claim IDs

Duplicate claims are detected with the same text normalization the dashboard uses for claim IDs (see the main README and `IMPLEMENTATION_PLAN.md`, Appendix A), in `common/text.py`.
