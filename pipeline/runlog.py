import json
import sys
import time
from collections import Counter
from datetime import datetime
from pathlib import Path

READABLE = ("ok", "partial")


class RunLog:
    def __init__(self, folder: Path, script: str, args: dict, total: int):
        stamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        self.dir = folder / "_logs"
        self.log_path = self.dir / f"{script}_{stamp}.log"
        self.json_path = self.dir / f"{script}_{stamp}.json"
        self.status = {
            "script": script,
            "command": " ".join(sys.argv),
            "args": {key: str(value) for key, value in args.items()},
            "started_at": datetime.now().isoformat(timespec="seconds"),
            "finished_at": None,
            "total": total,
            "done": 0,
            "counts": {},
            "status_pct": {},
            "readable_pct": None,
            "elapsed_seconds": 0,
            "eta_seconds": None,
            "last": None,
        }
        self.counts = Counter()

    def __enter__(self) -> "RunLog":
        self.dir.mkdir(parents=True, exist_ok=True)
        self.start = time.monotonic()
        self.log = self.log_path.open("a")
        self.write(f"# {self.status['command']}")
        self.write(f"# started {self.status['started_at']}, {self.status['total']} sites")
        self.save()
        return self

    def __exit__(self, *exc) -> None:
        self.status["finished_at"] = datetime.now().isoformat(timespec="seconds")
        self.status["eta_seconds"] = 0
        self.update_time()
        self.save()
        self.write(f"# finished {self.status['finished_at']}, {self.status['counts']}")
        self.log.close()

    def write(self, line: str) -> None:
        print(line, flush=True)
        self.log.write(line + "\n")
        self.log.flush()

    def record(self, status: str, line: str) -> None:
        self.counts[status] += 1
        self.status["done"] += 1
        self.status["counts"] = dict(self.counts)
        self.update_shares()
        self.status["last"] = line.strip()
        self.update_time()
        self.write(f"{self.status['done']:>5}/{self.status['total']} {line}")
        self.save()

    # TODO: percentages cover only the sites this run processed. For whole-folder totals before and after a
    # retry (and their difference), chain run JSONs or keep a per-site status list (an index) per folder,
    # instead of opening every site file. See FINDINGS (run logs) for the options.
    def update_shares(self) -> None:
        processed = {status: n for status, n in self.counts.items() if status != "skipped"}
        total = sum(processed.values())
        if total:
            self.status["status_pct"] = {status: round(100 * n / total, 1) for status, n in processed.items()}
            readable = sum(n for status, n in processed.items() if status in READABLE)
            self.status["readable_pct"] = round(100 * readable / total, 1)

    def update_time(self) -> None:
        elapsed = time.monotonic() - self.start
        done, total = self.status["done"], self.status["total"]
        self.status["elapsed_seconds"] = round(elapsed)
        if done and not self.status["finished_at"]:
            self.status["eta_seconds"] = round(elapsed / done * (total - done))

    def save(self) -> None:
        tmp = self.json_path.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.status, indent=2))
        tmp.replace(self.json_path)
