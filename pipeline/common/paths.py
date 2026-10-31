from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = REPO_ROOT / "data"
CRAWL_DIR = DATA_DIR / "crawl"
CLEAN_DIR = DATA_DIR / "clean"
CHUNK_DIR = DATA_DIR / "chunks"
FIRMS_CSV = DATA_DIR / "firms_filtered.csv"
