"""Offline tests: additions, missing IDs, safe persistence and failure handling."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

BUILDER = Path(__file__).resolve().parents[1] / "builder" / "ninepeso_catalog.py"


def record(item_id):
    return {"id": item_id, "kinopoisk_id": str(item_id),
            "imdb_id": None, "ru_title": f"Item {item_id}",
            "orig_title": None, "released": "2025"}


class FakeApi(BaseHTTPRequestHandler):
    fail = False
    calls = []

    def do_GET(self):
        FakeApi.calls.append(self.path)
        parts = self.path.split("/")
        if FakeApi.fail:
            self.send_response(503)
            self.end_headers()
            return
        if len(parts) != 5 or parts[:2] != ["", "api"] or parts[4]:
            self.send_error(400)
            return
        kind = parts[2]
        item_id = int(parts[3])
        known = {"movies": {1, 2, 3, 6, 7},
                 "tv-series": {1, 3, 4, 6}}
        if item_id not in known.get(kind, set()):
            self.send_response(404)
            self.end_headers()
            return
        body = json.dumps(record(item_id)).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass


class NinePesoCatalogTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = Path(self.tmp.name) / "9peso.json"
        self.baseline = {
            "version": 1,
            "progress": {"movies": 6, "tv_series": 5,
                         "movies_recheck": 1, "tv_series_recheck": 1},
            "movies": {str(n): record(n) for n in (1, 3, 6)},
            "tv_series": {str(n): record(n) for n in (1, 3)},
        }
        self.db.write_text(json.dumps(self.baseline), encoding="utf-8")
        FakeApi.fail = False
        FakeApi.calls = []
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), FakeApi)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=3)
        self.tmp.cleanup()

    def run_indexer(self):
        env = dict(os.environ, NINEPESO_PROXY="",
                   HTTP_PROXY="", HTTPS_PROXY="", http_proxy="", https_proxy="")
        return subprocess.run([
            sys.executable, str(BUILDER), "--catalog", str(self.db),
            "--api-base", f"http://127.0.0.1:{self.server.server_port}",
            "--forward", "2", "--tail", "2", "--holes", "2",
            "--refresh", "1", "--delay-ms", "0",
            "--timeout", "2", "--retries", "1",
        ], capture_output=True, text=True, env=env, timeout=15)

    def test_incremental_new_and_backfilled_ids(self):
        result = self.run_indexer()
        self.assertEqual(result.returncode, 0, result.stderr)
        updated = json.loads(self.db.read_text(encoding="utf-8"))
        self.assertEqual(updated["version"], 1)
        self.assertEqual(updated["progress"]["movies"], 8)
        self.assertEqual(updated["progress"]["tv_series"], 7)
        self.assertTrue({"1", "2", "3", "6", "7"} <= set(updated["movies"]))
        self.assertTrue({"1", "3", "4", "6"} <= set(updated["tv_series"]))
        self.assertIn("movies_tail", updated["progress"])
        self.assertIn("tv_series_holes", updated["progress"])
        self.assertIn("movies_recheck", updated["progress"])
        self.assertIn("OK:", result.stdout)

    def test_api_failure_never_modifies_existing_catalog(self):
        before = self.db.read_bytes()
        FakeApi.fail = True
        result = self.run_indexer()
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(self.db.read_bytes(), before)

    def test_missing_and_empty_database_are_rejected(self):
        self.db.unlink()
        self.assertNotEqual(self.run_indexer().returncode, 0)
        self.assertFalse(self.db.exists())
        self.db.write_text('{"version":1,"progress":{},"movies":{},"tv_series":{}}')
        self.assertNotEqual(self.run_indexer().returncode, 0)
        self.assertEqual(json.loads(self.db.read_text())["movies"], {})


if __name__ == "__main__":
    unittest.main()
