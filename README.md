# Plugin

This repository includes two independent parsers:

- TMDB collections: builder/build-index.js, .github/workflows/daily-index.yml,
  data/collectionsIndex.json (existing; unchanged).
- 9peso: builder/ninepeso_catalog.py, .github/workflows/ninepeso-index.yml,
  data/9peso.json.

## 9peso catalog maintenance

The existing Lampac 9peso catalog is published at:
https://raw.githubusercontent.com/ivzaislu/Plugin/main/data/9peso.json

GitHub Actions maintains the catalog every three hours, or on manual dispatch.
The standard-library Python parser checks up to 20 forward IDs, 50 tail IDs,
20 historical gaps and 10 known records PER TYPE on each run. Independent
progress cursors are stored in a small data/9peso-maintenance.json sidecar.
The published data/9peso.json retains the existing version-1 Lampac schema.
The large catalog is committed only when actual records change, preventing
unnecessary multi-megabyte Git history growth every three hours.

Safety rules:
- Never start from empty data: require existing nonempty movies and tv_series.
- Preserve every known record, including on an individual HTTP 404/410.
- Abort without publishing on API transport failures, bad JSON or invalid IDs.
- Write atomically; publish only completed successful runs.
- Commit only the small progress sidecar on cycles with no metadata changes.
- Do not keep streams, signed URLs, seasons or episode metadata in the index.

If the API is unreachable from GitHub-hosted runners, add a repository Actions
secret named NINEPESO_PROXY containing an HTTP(S) proxy URL, including required
credentials. The RF proxy used by Lampac does not automatically apply to
GitHub Actions. Never expose the proxy URL in logs.

Offline tests:
python3 -m unittest discover -s test -p "test_ninepeso*.py" -v

A Lampac consumer must validate the new remote catalog before replacing the
local data/9peso.json, and keep its current copy if download or validation fails.
