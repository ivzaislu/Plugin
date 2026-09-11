/**
 * builder/build-index.js
 *
 * Расширенный сборщик индекса коллекций TMDB.
 *
 * Стратегия обнаружения:
 *   1) глобальный popularity-срез;
 *   2) отдельный popularity-срез для каждого года;
 *   3) rating-срез поддерживается опционально, но по умолчанию выключен.
 *
 * data/collectionsIndex.json остаётся в корне репозитория.
 * Для тестов путь можно переопределить через COLLECTIONS_DATA_DIR.
 *
 * Запуск:
 *   TMDB_KEY=xxxx node builder/build-index.js \
 *     --pages 180 \
 *     --yearPages 2 \
 *     --yearAltPages 0 \
 *     --fromYear 1978 \
 *     --max 3500 \
 *     --delay 100 \
 *     --voteCountGte 100 \
 *     --yearVoteCountGte 25
 *
 * ENV:
 *   TMDB_KEY (required)
 *   TMDB_LANG (default ru-RU)
 *   TMDB_BASE_URL (default https://api.themoviedb.org/3; useful for tests)
 *   COLLECTIONS_DATA_DIR (optional; tests only, defaults to ../data)
 *   TMDB_DISCOVER_SORT (default popularity.desc)
 *   TMDB_VOTE_COUNT_GTE (default 100)
 *   TMDB_YEAR_VOTE_COUNT_GTE (default 25)
 *   TMDB_INCLUDE_ADULT (default false)
 *   TMDB_MAX_RETRIES (default 5)
 */

const fs = require('fs');
const path = require('path');

const fetchRequest = (...args) => {
  if (typeof globalThis.fetch === 'function') return globalThis.fetch(...args);
  return import('node-fetch').then(({ default: fetchImpl }) => fetchImpl(...args));
};

const TMDB_KEY = process.env.TMDB_KEY;
const LANG = process.env.TMDB_LANG || 'ru-RU';
const TMDB_BASE_URL = (process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3').replace(/\/+$/, '');

const DATA_DIR = process.env.COLLECTIONS_DATA_DIR
  ? path.resolve(process.env.COLLECTIONS_DATA_DIR)
  : path.join(__dirname, '..', 'data');
const OUT_FILE = path.join(DATA_DIR, 'collectionsIndex.json');

function argInt(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) {
    const value = parseInt(process.argv[i + 1], 10);
    if (!Number.isNaN(value)) return value;
  }
  return def;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function envInt(name, def) {
  const value = parseInt(process.env[name] || '', 10);
  return Number.isNaN(value) ? def : value;
}

const currentYear = new Date().getUTCFullYear();

const globalPages = clamp(argInt('pages', 180), 0, 500);
const yearPages = clamp(argInt('yearPages', 2), 0, 50);
const yearAltPages = clamp(argInt('yearAltPages', 0), 0, 20);
const fromYear = clamp(argInt('fromYear', 1978), 1870, currentYear + 1);
const toYear = clamp(argInt('toYear', currentYear + 1), fromYear, currentYear + 3);

const maxCollections = clamp(argInt('max', 3500), 1, 50000);
const delayMs = clamp(argInt('delay', 100), 0, 5000);
const checkpointEvery = clamp(argInt('checkpointEvery', 25), 1, 1000);

const discoverSort = process.env.TMDB_DISCOVER_SORT || 'popularity.desc';
const voteCountGte = Math.max(
  0,
  envInt('TMDB_VOTE_COUNT_GTE', argInt('voteCountGte', 100))
);
const yearVoteCountGte = Math.max(
  0,
  envInt('TMDB_YEAR_VOTE_COUNT_GTE', argInt('yearVoteCountGte', 25))
);
const includeAdult =
  (process.env.TMDB_INCLUDE_ADULT || 'false').toLowerCase() === 'true';
const maxRetries = clamp(envInt('TMDB_MAX_RETRIES', 5), 1, 10);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeName(name) {
  return String(name || '')
    .trim()
    .replace(/\s*\(коллекция\)\s*$/i, '')
    .replace(/\s*collection\s*$/i, '')
    .trim();
}

function loadExistingIndex() {
  try {
    if (!fs.existsSync(OUT_FILE)) return null;
    const raw = fs.readFileSync(OUT_FILE, 'utf8');
    const obj = JSON.parse(raw);
    return obj && Array.isArray(obj.items) ? obj : null;
  } catch (error) {
    console.warn('WARN: failed to read existing index:', error.message);
    return null;
  }
}

function saveIndex(obj) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

function buildTmdbUrl(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}/${String(endpoint).replace(/^\/+/, '')}`);
  url.searchParams.set('api_key', TMDB_KEY);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  return url;
}

async function tmdbGet(endpoint, params = {}, stats) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchRequest(buildTmdbUrl(endpoint, params), {
        headers: { Accept: 'application/json' },
      });

      stats.api_requests++;

      if (response.ok) {
        const data = await response.json();
        if (delayMs > 0) await sleep(delayMs);
        return data;
      }

      const text = await response.text().catch(() => '');
      const error = new Error(
        `TMDB ${response.status}: ${text.slice(0, 200)}`
      );
      error.status = response.status;
      lastError = error;

      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable || attempt === maxRetries) throw error;

      stats.retries++;
      const retryAfter = Number(response.headers.get('retry-after'));
      const retryDelay =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : Math.min(1000 * 2 ** (attempt - 1), 10000);

      await sleep(retryDelay);
    } catch (error) {
      lastError = error;

      if (
        error &&
        typeof error.status === 'number' &&
        error.status !== 429 &&
        error.status < 500
      ) {
        throw error;
      }

      if (attempt === maxRetries) throw error;

      if (!(error && typeof error.status === 'number')) {
        stats.retries++;
        await sleep(Math.min(1000 * 2 ** (attempt - 1), 10000));
      }
    }
  }

  throw lastError || new Error('Unknown TMDB request error');
}

function makeOutput(seenCollections, stats, config, inProgress) {
  return {
    updated_at: Date.now(),
    total: seenCollections.size,
    meta: {
      in_progress: inProgress,
      discovery_pages_scanned: stats.discovery_pages_scanned,
      discovery_rows_seen: stats.discovery_rows_seen,
      unique_movies_checked: stats.unique_movies_checked,
      duplicate_movies_skipped: stats.duplicate_movies_skipped,
      existing_collections_seen: stats.existing_collections_seen,
      collection_requests: stats.collection_requests,
      collections_rejected_single_part: stats.collections_rejected_single_part,
      added_now: stats.added_now,
      api_requests: stats.api_requests,
      retries: stats.retries,
      request_errors: stats.request_errors,
      config,
    },
    items: Array.from(seenCollections.values()),
  };
}

async function buildIndex() {
  if (!TMDB_KEY) {
    throw new Error(
      'TMDB_KEY env is required (add it as GitHub Actions secret)'
    );
  }

  const existing = loadExistingIndex();
  const seenCollections = new Map();
  const seenMovieIds = new Set();

  if (existing && Array.isArray(existing.items)) {
    for (const item of existing.items) {
      if (item && item.id) seenCollections.set(item.id, item);
    }
  }

  const stats = {
    discovery_pages_scanned: 0,
    discovery_rows_seen: 0,
    unique_movies_checked: 0,
    duplicate_movies_skipped: 0,
    existing_collections_seen: 0,
    collection_requests: 0,
    collections_rejected_single_part: 0,
    added_now: 0,
    api_requests: 0,
    retries: 0,
    request_errors: 0,
  };

  const config = {
    global_pages: globalPages,
    global_sort: discoverSort,
    global_vote_count_gte: voteCountGte,
    year_pages: yearPages,
    year_alt_pages: yearAltPages,
    year_vote_count_gte: yearVoteCountGte,
    from_year: fromYear,
    to_year: toYear,
    include_adult: includeAdult,
    max_collections: maxCollections,
    delay_ms: delayMs,
    max_retries: maxRetries,
  };

  let additionsSinceCheckpoint = 0;

  function checkpoint(force = false) {
    if (!force && additionsSinceCheckpoint < checkpointEvery) return;
    saveIndex(makeOutput(seenCollections, stats, config, true));
    additionsSinceCheckpoint = 0;
  }

  async function inspectMovie(movie) {
    const movieId = movie && movie.id;
    if (!movieId) return false;

    if (seenMovieIds.has(movieId)) {
      stats.duplicate_movies_skipped++;
      return false;
    }

    seenMovieIds.add(movieId);
    stats.unique_movies_checked++;

    let details;
    try {
      details = await tmdbGet(
        `movie/${movieId}`,
        { language: LANG },
        stats
      );
    } catch (error) {
      stats.request_errors++;
      console.warn(`WARN: movie/${movieId}:`, error.message);
      return false;
    }

    const belongs = details && details.belongs_to_collection;
    if (!belongs || !belongs.id) return false;

    if (seenCollections.has(belongs.id)) {
      stats.existing_collections_seen++;
      return false;
    }

    let collection;
    try {
      stats.collection_requests++;
      collection = await tmdbGet(
        `collection/${belongs.id}`,
        { language: LANG },
        stats
      );
    } catch (error) {
      stats.request_errors++;
      console.warn(`WARN: collection/${belongs.id}:`, error.message);
      return false;
    }

    const parts = Array.isArray(collection.parts) ? collection.parts : [];
    if (parts.length < 2) {
      stats.collections_rejected_single_part++;
      return false;
    }

    const item = {
      id: belongs.id,
      name: normalizeName(collection.name || belongs.name),
      poster_path: collection.poster_path || belongs.poster_path || null,
      backdrop_path: collection.backdrop_path || belongs.backdrop_path || null,
      parts_count: parts.length,
    };

    seenCollections.set(belongs.id, item);
    stats.added_now++;
    additionsSinceCheckpoint++;

    console.log(
      `ADD #${seenCollections.size}: ${item.name} (${item.parts_count} parts)`
    );

    checkpoint();

    return seenCollections.size >= maxCollections;
  }

  async function scanSlice(label, requestedPages, extraParams) {
    if (requestedPages <= 0 || seenCollections.size >= maxCollections) return true;

    console.log(`\nSCAN ${label}: up to ${requestedPages} pages`);

    for (let page = 1; page <= requestedPages; page++) {
      let discover;

      try {
        discover = await tmdbGet(
          'discover/movie',
          {
            language: LANG,
            include_adult: includeAdult ? 'true' : 'false',
            page,
            ...extraParams,
          },
          stats
        );
      } catch (error) {
        stats.request_errors++;
        console.warn(`WARN: ${label} page ${page}:`, error.message);
        continue;
      }

      stats.discovery_pages_scanned++;

      const results = Array.isArray(discover.results) ? discover.results : [];
      stats.discovery_rows_seen += results.length;

      for (const movie of results) {
        if (await inspectMovie(movie)) return true;
      }

      const totalPages = Math.min(
        Number(discover.total_pages) || requestedPages,
        500
      );

      console.log(
        `  page ${page}/${Math.min(requestedPages, totalPages)} | ` +
          `movies=${stats.unique_movies_checked} | ` +
          `collections=${seenCollections.size} | added=${stats.added_now}`
      );

      if (page >= totalPages) break;
    }

    return seenCollections.size >= maxCollections;
  }

  if (seenCollections.size >= maxCollections) {
    console.log(
      `Existing index already has ${seenCollections.size} collections, ` +
        `which is >= --max ${maxCollections}.`
    );
  } else {
    await scanSlice('global popularity', globalPages, {
      sort_by: discoverSort,
      'vote_count.gte': voteCountGte,
    });

    for (
      let year = toYear;
      year >= fromYear && seenCollections.size < maxCollections;
      year--
    ) {
      await scanSlice(`year ${year} popularity`, yearPages, {
        sort_by: 'popularity.desc',
        primary_release_year: year,
        'vote_count.gte': yearVoteCountGte,
      });

      if (seenCollections.size >= maxCollections) break;

      await scanSlice(`year ${year} rating`, yearAltPages, {
        sort_by: 'vote_average.desc',
        primary_release_year: year,
        'vote_count.gte': yearVoteCountGte,
      });
    }
  }

  const finalObj = makeOutput(seenCollections, stats, config, false);
  saveIndex(finalObj);
  return finalObj;
}

if (require.main === module) {
  buildIndex()
    .then((out) => {
      console.log(
        '\nOK:',
        new Date(out.updated_at).toISOString(),
        'total=',
        out.total,
        'added_now=',
        out.meta.added_now,
        'movies_checked=',
        out.meta.unique_movies_checked,
        'api_requests=',
        out.meta.api_requests
      );
    })
    .catch((error) => {
      console.error('ERROR:', error.message);
      process.exit(1);
    });
}

module.exports = {
  DATA_DIR,
  OUT_FILE,
  normalizeName,
  buildTmdbUrl,
  makeOutput,
  buildIndex,
};
