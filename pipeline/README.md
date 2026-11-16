# Pipeline

Python code that builds the data behind the dashboard and the survey. It selects Italian firms from an Orbis export, crawls their websites, uses an LLM (DeepSeek) to check whether each firm sells to consumers and to find and classify its environmental claims, writes a short reason per claim, and exports the dashboard file (`firms.json`), the C/T2 assignment and the survey firm list.

All data lives in `data/` at the repo root, which is git-ignored and never committed.

## Setup

Python 3.13.

```
python3 -m venv pipeline/.venv
pipeline/.venv/bin/pip install -r pipeline/requirements.txt
pipeline/.venv/bin/python -m playwright install chromium
pipeline/.venv/bin/pre-commit install
```

The LLM steps read `DEEPSEEK_API_KEY` from `.env` at the repo root (git-ignored). The pre-commit hooks run ruff on `pipeline/` and block data files, CSVs, large files, private keys and `.env` from being committed.

## Layout

```
pipeline/
├── main.py     runs one step, several steps in order, or the full list in batches
├── common/     paths, command-line options, run logs, text normalisation, keyword list
├── firms/      firm list from Orbis
├── crawl/      crawling, retries, crawl summary
├── text/       cleaning and chunking page text
├── llm/        DeepSeek client, B2C check, claims, review table, reasons, prompts
└── export/     master tables, randomisation, IDs, firms.json, survey file
```

## Steps

Run from the repo root: `pipeline/.venv/bin/python -m pipeline.main <step> [options]`. Every step lists its options with `--help`.

### Collecting claims

| Step | What it does | Output |
|---|---|---|
| `firms` | keeps firms with a usable website, one firm per website; flags micro firms and consumer-facing sectors | `data/firms_filtered.csv` |
| `crawl` | homepage plus up to 5 subpages chosen for sustainability and about-us words; status ok / partial / thin / failed | `data/crawl/<folder>/<domain>.json.gz` |
| `retry` | retries timeouts with a longer wait, blocked and JavaScript sites with a headless browser | same files, improved |
| `summary` | crawl report per firm list | `data/crawl/summary_*.csv` |
| `clean` | fixes characters, removes repeated and cookie blocks; never changes words | `data/clean/<folder>/` |
| `chunk` | pieces of up to ~3,000 tokens, at most 8 per site | `data/chunks/<folder>.jsonl` |
| `b2c` | one call per firm: sells to consumers yes / mixed / no / unclear, with a quote | `data/b2c/<model>/` |
| `claims` | one call per chunk: every environmental claim quoted word for word, with category, light and confidence; the code checks each quote is on the page | `data/claims/<model>/` |
| `export` | review table: claims, unsure items, possible misses from the keyword check | `data/claims/<model>/*_review.csv` |
| `review-sample` | sample of the review table split between reviewers | `*_sample_<reviewer>.csv` |

`python -m pipeline.main run --firms CSV` runs these in order. `--folder NAME` keeps every step on one folder so a stopped run resumes. Runs can be interrupted: work already saved is skipped.

### Full list in batches

```
python -m pipeline.main batch split                  # data/crawl/full/batch_01.csv ... batch_17.csv
python -m pipeline.main batch crawl --workers 60     # crawl, summary, clean, chunk per batch
python -m pipeline.main batch llm --llm-workers 50   # B2C, then claims; off-peak only
```

Finished batches are marked in `data/crawl/full/`, so re-running resumes. `batch llm` waits for off-peak hours and for the DeepSeek balance to be above `--min-balance`. LLM calls retry on timeouts and 429/5xx; on 402 (balance used up) the step stops; top up and run the same command again.

### Export (after the full run)

Run in this order:

| Step | What it does | Output |
|---|---|---|
| `master` | one table per firm (Orbis fields, crawl, B2C, claim counts) and per claim; fills hand-coded ATECO divisions from `data/export/ateco_hand_coded.csv` | `data/export/firms_master.csv`, `claims_master.csv` |
| `randomize` | C/T2 for the firms with claims, stratified by size × red claims below / at or above the median; seed 20261114 | `data/export/assignment.csv`, `assignment_balance.csv` |
| `reasons` | one reason per claim in English and Italian (`REASON_PROMPT_v1.md`); retries in smaller calls until none is missing | `data/reasons/<model>/all.jsonl` |
| `ids` | `firm_id` F00001… (random order, seed 20261114, never renumbered), `crawl_id` `<firm_id>-C01`, `claim_id` `<firm_id>-` + 6 characters of the sha256 of the normalised quote | `data/export/firm_ids.csv` |
| `master` again | adds the IDs and reasons to the master tables | same files |
| `firms-json` | the dashboard file, schema 1.1, checked before writing | `data/export/firms.json` |
| `survey` | survey firm list in Italian: Orbis fields, arm, sector sentence (by ATECO division), passphrase and report link | `data/export/survey_firms_<date>.csv`, `.xlsx` |

The survey step reads the passphrases from Aleksandra's file (`data/export/firm_report_links_aleksandra_2026-11-15.xlsx`) and the sector sentences from `data/review/sector_sentences_draft_2026-11-15.csv`. Do not re-run `randomize` or `ids` with another seed once the files are shared.

## Claim IDs

Claims are matched with the same text normalisation the dashboard uses for claim IDs (`common/text.py`; see the main README and `IMPLEMENTATION_PLAN.md`, Appendix A).
