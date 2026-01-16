/**
 * build-index.js
 * Генерирует data/collections_index.json (и опционально data/collectionsIndex.json) для GitHub Pages / Raw.
 * Запуск локально:
 *   TMDB_KEY=xxxx node build-index.js --pages 120 --max 5000 --delay 120
 *
 * ENV:
 *  TMDB_KEY (required)
 *  TMDB_LANG (default ru-RU)
 *  TMDB_DISCOVER_SORT (default popularity.desc)
 *  TMDB_VOTE_COUNT_GTE (default 200)
 *  TMDB_INCLUDE_ADULT (default false)
 */

const fs = require('fs');
const path = require('path');

// node-fetch v3 ESM
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const TMDB_KEY = process.env.TMDB_KEY;
const LANG = process.env.TMDB_LANG || 'ru-RU';

// работаем ТОЛЬКО с data
const DATA_DIR = path.join(__dirname, 'data');

// основной файл (как у тебя исторически)
const OUT_FILE = path.join(__dirname, 'data', 'collectionsIndex.json');

function argInt(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) {
    const v = parseInt(process.argv[i + 1], 10);
    if (!Number.isNaN(v)) return v;
  }
  return def;
}

const pages = Math.max(1, Math.min(argInt('pages', 120), 500));
const maxCollections = Math.max(500, Math.min(argInt('max', 5000), 20000));
const delayMs = Math.max(0, Math.min(argInt('delay', 120), 2000));
const discoverSort = process.env.TMDB_DISCOVER_SORT || 'popularity.desc';
const voteCountGte = Math.max(0, parseInt(process.env.TMDB_VOTE_COUNT_GTE || String(argInt('voteCountGte', 200)), 10) || 200);
const includeAdult = (process.env.TMDB_INCLUDE_ADULT || 'false').toLowerCase() === 'true';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function tmdbGet(url) {
  const r = await fetch('https://api.themoviedb.org/3/' + url, { headers: { Accept: 'application/json' } });
  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    const err = new Error(`TMDB ${r.status}: ${txt.slice(0, 200)}`);
    err.status = r.status;
    throw err;
  }
  return r.json();
}

function normalizeName(name) {
  return String(name || '')
    .trim()
    .replace(/\s*\(коллекция\)\s*$/i, '')
    .replace(/\s*collection\s*$/i, '')
    .trim();
}

function loadExistingIndex() {
  // читаем сначала основной, потом alias (на всякий)
  const files = [OUT_FILE, OUT_FILE_ALIAS];
  for (const f of files) {
    try {
      if (fs.existsSync(f)) {
        const raw = fs.readFileSync(f, 'utf8');
        const obj = JSON.parse(raw);
        if (obj && Array.isArray(obj.items)) return obj;
      }
    } catch (e) {
      // игнор
    }
  }
  return null;
}

function saveIndex(obj) {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  const json = JSON.stringify(obj, null, 2);

  // основной (legacy)
  fs.writeFileSync(OUT_FILE, json, 'utf8');

  // alias (удобно для URL), можно удалить если не нужен
  fs.writeFileSync(OUT_FILE_ALIAS, json, 'utf8');
}

async function buildIndex() {
  if (!TMDB_KEY) throw new Error('TMDB_KEY env is required (add it as GitHub Actions secret)');

  const existing = loadExistingIndex();
  const seenCollections = new Map();

  if (existing && Array.isArray(existing.items)) {
    for (const it of existing.items) {
      if (it && it.id) seenCollections.set(it.id, it);
    }
  }

  let scanned = 0;
  let added = 0;

  for (let page = 1; page <= pages; page++) {
    const discoverUrl =
      `discover/movie?api_key=${TMDB_KEY}` +
      `&language=${encodeURIComponent(LANG)}` +
      `&sort_by=${encodeURIComponent(discoverSort)}` +
      `&vote_count.gte=${voteCountGte}` +
      `&include_adult=${includeAdult ? 'true' : 'false'}` +
      `&page=${page}`;

    let discover;
    try {
      discover = await tmdbGet(discoverUrl);
    } catch (e) {
      if (e.status === 429) {
        await sleep(1500);
        page--;
        continue;
      }
      throw e;
    }

    const results = Array.isArray(discover.results) ? discover.results : [];
    for (const movie of results) {
      scanned++;
      const id = movie && movie.id;
      if (!id) continue;

      let details;
      try {
        details = await tmdbGet(`movie/${id}?api_key=${TMDB_KEY}&language=${encodeURIComponent(LANG)}`);
      } catch (e) {
        if (e.status === 429) {
          await sleep(1500);
          continue;
        }
        await sleep(delayMs);
        continue;
      }
      await sleep(delayMs);

      const b = details && details.belongs_to_collection;
      if (!b || !b.id) continue;

      if (seenCollections.has(b.id)) continue;

      let col;
      try {
        col = await tmdbGet(`collection/${b.id}?api_key=${TMDB_KEY}&language=${encodeURIComponent(LANG)}`);
      } catch (e) {
        if (e.status === 429) {
          await sleep(1500);
          continue;
        }
        await sleep(delayMs);
        continue;
      }
      await sleep(delayMs);

      const parts = Array.isArray(col.parts) ? col.parts : [];
      if (parts.length < 2) continue;

      const item = {
        id: b.id,
        name: normalizeName(col.name || b.name),
        poster_path: col.poster_path || b.poster_path || null,
        backdrop_path: col.backdrop_path || b.backdrop_path || null,
        parts_count: parts.length,
      };

      seenCollections.set(b.id, item);
      added++;

      if (seenCollections.size >= maxCollections) break;
    }

    if (seenCollections.size >= maxCollections) break;
  }

  const finalObj = {
    updated_at: Date.now(),
    total: seenCollections.size,
    meta: { pages_scanned: pages, movies_scanned: scanned, added_now: added },
    items: Array.from(seenCollections.values()),
  };

  saveIndex(finalObj);
  return finalObj;
}

buildIndex()
  .then((out) => {
    console.log('OK:', new Date(out.updated_at).toISOString(), 'total=', out.total, 'added_now=', out.meta.added_now);
  })
  .catch((e) => {
    console.error('ERROR:', e.message);
    process.exit(1);
  });
