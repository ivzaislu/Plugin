const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');
const builderPath = path.join(repoRoot, 'builder', 'build-index.js');

function runBuilder(args, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [builderPath, ...args], {
      cwd: repoRoot,
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}

function listen(server) {
  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address()));
    server.once('error', reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test('builder fails cleanly when TMDB_KEY is missing', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'collections-builder-no-key-'));
  const result = await runBuilder(
    ['--pages', '0', '--yearPages', '0', '--yearAltPages', '0'],
    {
      TMDB_KEY: '',
      COLLECTIONS_DATA_DIR: temp,
    }
  );

  assert.equal(result.code, 1);
  assert.match(result.stderr, /TMDB_KEY env is required/);
});

test('builder discovers collections, preserves existing data, deduplicates movies and retries 429', async (t) => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'collections-builder-'));
  const dataDir = path.join(tempRoot, 'data');
  fs.mkdirSync(dataDir, { recursive: true });

  const existing = {
    updated_at: 1,
    total: 1,
    meta: {},
    items: [
      {
        id: 100,
        name: 'Existing',
        poster_path: '/existing.jpg',
        backdrop_path: null,
        parts_count: 2,
      },
    ],
  };
  fs.writeFileSync(
    path.join(dataDir, 'collectionsIndex.json'),
    JSON.stringify(existing, null, 2),
    'utf8'
  );

  let collection200Attempts = 0;
  let collection100Requested = false;
  let badApiKey = false;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');

    if (url.searchParams.get('api_key') !== 'test-key') {
      badApiKey = true;
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status_message: 'bad key' }));
      return;
    }

    const json = (status, body, headers = {}) => {
      res.writeHead(status, { 'content-type': 'application/json', ...headers });
      res.end(JSON.stringify(body));
    };

    if (url.pathname === '/3/discover/movie') {
      const year = url.searchParams.get('primary_release_year');
      if (!year) {
        json(200, { page: 1, total_pages: 1, results: [{ id: 1 }, { id: 2 }] });
        return;
      }
      if (year === '2024') {
        json(200, { page: 1, total_pages: 1, results: [{ id: 2 }, { id: 3 }, { id: 4 }] });
        return;
      }
      json(200, { page: 1, total_pages: 1, results: [] });
      return;
    }

    if (url.pathname === '/3/movie/1') {
      json(200, { id: 1, belongs_to_collection: { id: 100, name: 'Existing Collection' } });
      return;
    }
    if (url.pathname === '/3/movie/2') {
      json(200, { id: 2, belongs_to_collection: null });
      return;
    }
    if (url.pathname === '/3/movie/3') {
      json(200, { id: 3, belongs_to_collection: { id: 200, name: 'Beta Collection' } });
      return;
    }
    if (url.pathname === '/3/movie/4') {
      json(200, { id: 4, belongs_to_collection: { id: 300, name: 'Single Collection' } });
      return;
    }

    if (url.pathname === '/3/collection/100') {
      collection100Requested = true;
      json(500, { status_message: 'existing collection should not be requested' });
      return;
    }

    if (url.pathname === '/3/collection/200') {
      collection200Attempts++;
      if (collection200Attempts === 1) {
        json(429, { status_message: 'rate limited' }, { 'retry-after': '0.001' });
        return;
      }
      json(200, {
        id: 200,
        name: 'Beta (коллекция)',
        poster_path: '/beta.jpg',
        backdrop_path: '/beta-bg.jpg',
        parts: [{ id: 21 }, { id: 22 }, { id: 23 }],
      });
      return;
    }

    if (url.pathname === '/3/collection/300') {
      json(200, {
        id: 300,
        name: 'Single Collection',
        poster_path: null,
        backdrop_path: null,
        parts: [{ id: 31 }],
      });
      return;
    }

    json(404, { status_message: `unhandled ${url.pathname}` });
  });

  const address = await listen(server);
  t.after(() => close(server));

  const result = await runBuilder(
    [
      '--pages', '1',
      '--yearPages', '1',
      '--yearAltPages', '0',
      '--fromYear', '2024',
      '--toYear', '2024',
      '--max', '50',
      '--delay', '0',
      '--checkpointEvery', '1',
      '--voteCountGte', '0',
      '--yearVoteCountGte', '0',
    ],
    {
      TMDB_KEY: 'test-key',
      TMDB_BASE_URL: `http://127.0.0.1:${address.port}/3`,
      COLLECTIONS_DATA_DIR: dataDir,
      TMDB_MAX_RETRIES: '3',
    }
  );

  assert.equal(result.code, 0, `stderr:\n${result.stderr}\nstdout:\n${result.stdout}`);
  assert.equal(badApiKey, false);
  assert.equal(collection100Requested, false);
  assert.equal(collection200Attempts, 2);
  assert.match(result.stdout, /OK:/);

  const output = JSON.parse(
    fs.readFileSync(path.join(dataDir, 'collectionsIndex.json'), 'utf8')
  );

  assert.equal(output.total, 2);
  assert.equal(output.meta.in_progress, false);
  assert.equal(output.meta.discovery_pages_scanned, 2);
  assert.equal(output.meta.discovery_rows_seen, 5);
  assert.equal(output.meta.unique_movies_checked, 4);
  assert.equal(output.meta.duplicate_movies_skipped, 1);
  assert.equal(output.meta.existing_collections_seen, 1);
  assert.equal(output.meta.collection_requests, 2);
  assert.equal(output.meta.collections_rejected_single_part, 1);
  assert.equal(output.meta.added_now, 1);
  assert.equal(output.meta.retries, 1);
  assert.equal(output.meta.request_errors, 0);

  const existingAfter = output.items.find((item) => item.id === 100);
  assert.deepEqual(existingAfter, existing.items[0]);

  const beta = output.items.find((item) => item.id === 200);
  assert.deepEqual(beta, {
    id: 200,
    name: 'Beta',
    poster_path: '/beta.jpg',
    backdrop_path: '/beta-bg.jpg',
    parts_count: 3,
  });

  assert.equal(output.items.some((item) => item.id === 300), false);
});
