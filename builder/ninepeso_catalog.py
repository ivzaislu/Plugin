#!/usr/bin/env python3
"""Maintain an existing Lampac 9peso catalog, without resetting the database."""

import argparse
import bisect
import json
import os
from pathlib import Path
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, Request, build_opener

CATALOG = Path(__file__).resolve().parents[1] / "data" / "9peso.json"
KINDS = (("movies", "movies"), ("tv_series", "tv-series"))
MAX_RESPONSE = 64 * 1024 * 1024


def load_catalog(path):
    if not path.is_file():
        raise ValueError("A nonempty existing 9peso catalog is required")
    with path.open(encoding="utf-8") as stream:
        db = json.load(stream)
    if not isinstance(db, dict) or db.get("version") != 1:
        raise ValueError("Invalid 9peso catalog version")
    if not isinstance(db.get("progress"), dict):
        raise ValueError("Missing catalog progress")
    for kind, _ in KINDS:
        records = db.get(kind)
        if not isinstance(records, dict) or not records:
            raise ValueError("Missing existing catalog records: " + kind)
        for key, record in records.items():
            if not key.isdecimal() or not isinstance(record, dict) or \
                    type(record.get("id")) is not int or record["id"] != int(key):
                raise ValueError("Invalid record in " + kind)
        progress = db["progress"].get(kind)
        if type(progress) is not int or progress < max(map(int, records)):
            raise ValueError("Invalid forward cursor for " + kind)
    return db


def load_state(path, db):
    if not path.exists():
        return
    with path.open(encoding="utf-8") as stream:
        state = json.load(stream)
    if not isinstance(state, dict) or state.get("version") != 1 or             not isinstance(state.get("progress"), dict):
        raise ValueError("Invalid maintenance progress file")
    for key, value in state["progress"].items():
        if type(value) is not int or value < 0:
            raise ValueError("Invalid maintenance progress value")
        if key in ("movies", "tv_series"):
            db["progress"][key] = max(db["progress"][key], value)
        elif key.endswith(("_tail", "_holes", "_refresh")):
            db["progress"][key] = value


def metadata_record(data, expected):
    if not isinstance(data, dict) or type(data.get("id")) is not int \
            or data["id"] != expected:
        raise ValueError("API returned invalid or mismatched ID")
    def txt(value):
        return str(value) if value is not None else None
    title = txt(data.get("ru_title"))
    original = txt(data.get("orig_title") or data.get("original_title"))
    if not ((title and title.strip()) or (original and original.strip())):
        raise ValueError("API record without title")
    return {
        "id": expected,
        "imdb_id": txt(data.get("imdb_id")),
        "kinopoisk_id": txt(data.get("kinopoisk_id")),
        "ru_title": title,
        "orig_title": original,
        "released": txt(data.get("released")),
    }


class Client:
    def __init__(self, base, proxy, delay_ms, timeout, retries):
        if not (base.startswith("https://videobalanser.cc") or
                base.startswith("http://127.0.0.1:")):
            raise ValueError("Unsupported API origin")
        self.base = base.rstrip("/")
        self.delay = delay_ms / 1000
        self.timeout = timeout
        self.retries = retries
        self.last_request = 0
        self.requests = 0
        self.opener = build_opener(ProxyHandler({"https": proxy, "http": proxy})) \
            if proxy else build_opener()

    def fetch(self, endpoint, item_id):
        url = f"{self.base}/api/{endpoint}/{item_id}/"
        for attempt in range(self.retries):
            pause = self.delay - (time.monotonic() - self.last_request)
            if pause > 0:
                time.sleep(pause)
            self.last_request = time.monotonic()
            self.requests += 1
            req = Request(url, headers={
                "Accept": "application/json",
                "User-Agent": "Lampac-9peso-index/1.0",
                "Referer": "https://videobalanser.cc/",
            })
            try:
                with self.opener.open(req, timeout=self.timeout) as response:
                    raw = response.read(MAX_RESPONSE + 1)
                    if len(raw) > MAX_RESPONSE:
                        raise ValueError("API response exceeded size cap")
                    return metadata_record(json.loads(raw), item_id)
            except HTTPError as error:
                if error.code in (404, 410):
                    return None
                if (error.code != 429 and error.code < 500) or attempt + 1 == self.retries:
                    raise RuntimeError(f"{endpoint}/{item_id}: HTTP {error.code}") from error
                retry_after = error.headers.get("Retry-After", "")
                time.sleep(min(30, max(1, int(retry_after))) if retry_after.isdecimal()
                           else min(10, 2 ** attempt))
            except (TimeoutError, URLError, OSError) as error:
                if attempt + 1 == self.retries:
                    raise RuntimeError(f"{endpoint}/{item_id}: network failure") from error
                time.sleep(min(10, 2 ** attempt))


def scan_kind(db, kind, endpoint, client, args):
    records = db[kind]
    progress = db["progress"]
    initial_forward = progress[kind]
    max_known = max(map(int, records))
    seen = set()
    stats = {"added": 0, "changed": 0, "missing": 0}

    def probe(item_id):
        if item_id in seen:
            return
        seen.add(item_id)
        value = client.fetch(endpoint, item_id)
        if value is None:
            # A single 404/410 must never delete a previously indexed item.
            stats["missing"] += 1
        elif str(item_id) not in records:
            records[str(item_id)] = value
            stats["added"] += 1
        elif records[str(item_id)] != value:
            records[str(item_id)] = value
            stats["changed"] += 1

    for item_id in range(initial_forward + 1, initial_forward + args.forward + 1):
        probe(item_id)
        progress[kind] = item_id

    # Tail holes after the newest known title: round-robin independently
    # from the forward cursor so late additions are not skipped forever.
    start, end = max_known + 1, initial_forward
    if start <= end:
        key = kind + "_tail"
        cursor = progress.get(key, start - 1)
        if type(cursor) is not int or cursor < start - 1 or cursor > end:
            cursor = start - 1
        for _ in range(min(args.tail, end - start + 1)):
            cursor = start if cursor >= end else cursor + 1
            if str(cursor) not in records:
                probe(cursor)
        progress[key] = cursor

    # Previously missing old IDs: skip occupied IDs without HTTP requests.
    key = kind + "_holes"
    cursor = progress.get(key, 0)
    if type(cursor) is not int or not 0 <= cursor <= max_known:
        cursor = 0
    checks, visited = 0, 0
    while checks < args.holes and visited < max_known:
        cursor = 1 if cursor >= max_known else cursor + 1
        visited += 1
        if str(cursor) not in records and cursor not in seen:
            probe(cursor)
            checks += 1
    progress[key] = cursor

    # Rotating refresh of older known records, without full catalog rescans.
    key = kind + "_refresh"
    cursor = progress.get(key, 0)
    if type(cursor) is not int or cursor < 0:
        cursor = 0
    all_ids = sorted(map(int, records))
    offset = bisect.bisect_right(all_ids, cursor)
    for i in range(min(args.refresh, len(all_ids))):
        item_id = all_ids[(offset + i) % len(all_ids)]
        probe(item_id)
        progress[key] = item_id
    return stats


def save_atomic(path, catalog):
    fd, filename = tempfile.mkstemp(dir=path.parent, prefix=".9peso-", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(catalog, stream, ensure_ascii=False, separators=(",", ":"))
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(filename, path)
    finally:
        if os.path.exists(filename):
            os.unlink(filename)


def nonnegative(value):
    number = int(value)
    if number < 0:
        raise argparse.ArgumentTypeError("Must be nonnegative")
    return number


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--catalog", type=Path, default=CATALOG)
    parser.add_argument("--api-base", default="https://videobalanser.cc")
    parser.add_argument("--forward", type=nonnegative, default=20)
    parser.add_argument("--tail", type=nonnegative, default=50)
    parser.add_argument("--holes", type=nonnegative, default=20)
    parser.add_argument("--refresh", type=nonnegative, default=10)
    parser.add_argument("--delay-ms", type=nonnegative, default=1000)
    parser.add_argument("--timeout", type=nonnegative, default=35)
    parser.add_argument("--retries", type=nonnegative, default=3)
    args = parser.parse_args()
    if args.timeout < 1 or not 1 <= args.retries <= 5:
        parser.error("timeout must be positive; retries must be 1-5")

    db = load_catalog(args.catalog)
    state_path = args.catalog.with_name("9peso-maintenance.json")
    load_state(state_path, db)
    counts = {kind: len(db[kind]) for kind, _ in KINDS}
    changed = 0
    client = Client(args.api_base, os.getenv("NINEPESO_PROXY", ""),
                    args.delay_ms, args.timeout, args.retries)
    for kind, endpoint in KINDS:
        stats = scan_kind(db, kind, endpoint, client, args)
        changed += stats["added"] + stats["changed"]
        print(f"{kind}: {stats}; total={len(db[kind])}, progress={db['progress'][kind]}", flush=True)
    if any(len(db[kind]) < counts[kind] for kind, _ in KINDS):
        raise ValueError("Refusing catalog shrinkage")
    # Avoid a new 16-MB Git blob every three hours when no titles change.
    # Progress still survives the next runner in the tiny sidecar file.
    if changed > 0:
        save_atomic(args.catalog, db)
    save_atomic(state_path, {"version": 1, "progress": db["progress"]})
    print(f"OK: {client.requests} requests; metadata_changes={changed}", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        import sys
        print(f"ERROR: {type(error).__name__}: {error}", file=sys.stderr)
        sys.exit(1)
