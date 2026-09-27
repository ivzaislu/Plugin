(function () {
  'use strict';

  // =========================================================
  // Random FRANCHISE ROWS from Parser Index
  // - fetch /parser/collectionsIndex (cached in Storage)
  // - pick random collections -> for each row load TMDB collection/{id} parts
  // =========================================================

  var SOURCE_ROWS = 'tmdb_random_collection_rows';

  // ===== Index URL (can override) =====
// по умолчанию берём индекс с GitHub Pages (замени OWNER/REPO на свои).
// Можно переопределить:
//   localStorage.setItem('rf_index_url','https://<OWNER>.github.io/<REPO>/collectionsIndex.json')
// или raw:
//   localStorage.setItem('rf_index_url','https://ivzaislu.github.io/Plugin/data/collectionsIndex.json')
function getIndexUrl(){
  var saved = '';
  try { saved = localStorage.getItem('rf_index_url') || ''; } catch(e){}
  if(saved) return saved.replace(/\s+/g,'').replace(/\/+$/,'');
  // fallback на старый ключ (если кто-то уже использовал rf_parser_base)
  try {
    var old = localStorage.getItem('rf_parser_base') || '';
    if(old){
      old = old.replace(/\/+$/,'');
      // если дали прямой .json — используем как есть
      if(/\.json($|\?)/i.test(old)) return old;
      // иначе считаем что это база парсера (старый сервер)
      return old + '/collectionsIndex';
    }
  } catch(e){}
  return 'https://ivzaislu.github.io/Plugin/data/collectionsIndex.json';
}

var INDEX_URL = getIndexUrl();
// STATUS_URL больше не нужен (серверного статуса нет), оставим пустым чтобы не падать
var STATUS_URL = '';

  // ===== Settings keys =====
  var CFG_COMP = 'rand_franchise_cfg';

  var K_ROWS_PER_PAGE  = 'rf_rows_per_page';    // '8','12','18','24','30'
  var K_MOVIES_PER_ROW = 'rf_movies_per_row';   // '10','20','30'
  var K_CONCURRENCY    = 'rf_concurrency';      // '2','3','5'

  var K_EXCLUDE_ANIME  = 'rf_exclude_anime';    // bool
  var K_EXCLUDE_ANIM   = 'rf_exclude_anim';     // bool

  var K_RESET_TRIGGER  = 'rf_reset_trigger';    // button
  var K_RELOAD_INDEX   = 'rf_reload_index';     // button

  // ===== Storage cache for index =====
  var INDEX_STORE_KEY = 'rf_parser_index_cache_v1';
  var INDEX_TTL = 1000 * 60 * 60 * 24; // 24 часа

  // ===== Runtime =====
  var TMDB_DELAY = 0;
  var MAX_ATTEMPTS_PER_BATCH = 600;

  // ===== GLOBAL runtime state =====
  window.plugin_rand_rows_inflight = window.plugin_rand_rows_inflight || new Set();
  window.plugin_rand_rows_session = window.plugin_rand_rows_session || {};

  // =========================================================
  // PERSISTENT "DELIVERED" anti-dup (works even if script reloads)
  // =========================================================
  var DELIVERED_KEY = 'rf_delivered_ids_v1';
  var DELIVERED_MAX = 60000;
  var deliveredSaveTimer = null;

  function deliveredLoad(){
    try {
      var raw = Lampa.Storage.get(DELIVERED_KEY, '');
      if(!raw) return new Set();
      var arr = JSON.parse(raw);
      if(!Array.isArray(arr)) return new Set();
      return new Set(arr.map(String));
    } catch(e){ return new Set(); }
  }

  function deliveredScheduleSave(){
    if (deliveredSaveTimer) return;
    deliveredSaveTimer = setTimeout(function(){
      deliveredSaveTimer = null;
      try {
        var arr = Array.from(window.__rf_delivered || []);
        if (arr.length > DELIVERED_MAX) arr = arr.slice(arr.length - DELIVERED_MAX);
        Lampa.Storage.set(DELIVERED_KEY, JSON.stringify(arr));
      } catch(e){}
    }, 250);
  }

  window.__rf_delivered = window.__rf_delivered || deliveredLoad();

  function deliveredHas(id){ return window.__rf_delivered.has(String(id)); }
  function deliveredAdd(id){
    id = String(id);
    if(!window.__rf_delivered.has(id)){
      window.__rf_delivered.add(id);
      deliveredScheduleSave();
    }
  }
  function deliveredClear(){
    try { Lampa.Storage.set(DELIVERED_KEY, ''); } catch(e){}
    window.__rf_delivered = new Set();
  }

  // =========================================================
  // RAM cache for collection parts
  // =========================================================
  var partsCache = {};
  var PARTS_TTL = 1000 * 60 * 30;

  function partsGet(id){
    var c = partsCache[id];
    if(!c) return null;
    if(Date.now() - c.ts > PARTS_TTL) return null;
    return c.data;
  }
  function partsSet(id, data){
    partsCache[id] = { ts: Date.now(), data: data };
  }

  // ===== Config helpers =====
  function cfgBool(key, def) {
    var v = Lampa.Storage.get(key);
    if (v === undefined || v === null || v === '') return !!def;
    return !!v;
  }
  function cfgStr(key, def) {
    var v = Lampa.Storage.get(key);
    if (v === undefined || v === null || v === '') return String(def);
    return String(v);
  }
  function cfgInt(key, def) {
    var v = parseInt(cfgStr(key, def), 10);
    return isNaN(v) ? parseInt(def, 10) : v;
  }

  function getCfg() {
    return {
      rowsPerPage: cfgInt(K_ROWS_PER_PAGE, 18),
      moviesPerRow: cfgInt(K_MOVIES_PER_ROW, 20),
      concurrency: cfgInt(K_CONCURRENCY, 5),
      excludeAnime: cfgBool(K_EXCLUDE_ANIME, true),
      excludeAnimation: cfgBool(K_EXCLUDE_ANIM, false),
      minParts: 2
    };
  }

  function normalizeCollectionName(name) {
    name = String(name || '').trim();
    name = name.replace(/\s*\(коллекция\)\s*$/i, '').trim();
    name = name.replace(/\s*collection\s*$/i, '').trim();
    return name || 'Коллекция';
  }

  // ===== Index cache in Storage =====
  function loadIndexFromStorage() {
    try {
      var raw = Lampa.Storage.get(INDEX_STORE_KEY, '');
      if (!raw) return null;
      var obj = JSON.parse(raw);
      if (!obj || !Array.isArray(obj.items)) return null;
      if (!obj.ts || (Date.now() - obj.ts > INDEX_TTL)) return null;
      return obj.items;
    } catch (e) { return null; }
  }

  function saveIndexToStorage(items) {
    try {
      var MAX_SAVE = 12000;
      var trimmed = (items || []).slice(0, MAX_SAVE);
      Lampa.Storage.set(INDEX_STORE_KEY, JSON.stringify({ ts: Date.now(), items: trimmed }));
    } catch (e) {}
  }

  function clearIndexStorage(){
    try { Lampa.Storage.set(INDEX_STORE_KEY, ''); } catch(e){}
  }

  function fetchJson(url, ok, err) {
    Lampa.Network.silent(url, function (data) { ok(data); }, function (a, c) { err(c || a); });
  }

  function getIndex(cbOk, cbErr, forceReload) {
    if (!forceReload) {
      var cached = loadIndexFromStorage();
      if (cached && cached.length) return cbOk(cached);
    }

    fetchJson(INDEX_URL, function (data) {
      var items = data && Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : null);
      if (!items || !items.length) return cbErr(new Error('Bad index format'));

      items = items.filter(function (x) { return x && x.id && x.poster_path; });

      saveIndexToStorage(items);
      cbOk(items);
    }, function () {
      cbErr(new Error('Index fetch failed: ' + INDEX_URL));
    });
  }

  // ===== TMDB collection parts =====
  function tmdbUrl(path) { return Lampa.TMDB.api(path); }

  function fetchCollectionParts(collectionId, cbOk, cbErr) {
    var cached = partsGet(collectionId);
    if (cached) return cbOk(cached);

    var url = "collection/" + collectionId + "?api_key=" + Lampa.TMDB.key() + "&language=ru-RU";
    Lampa.Network.silent(tmdbUrl(url), function (data) {
      if (!data || !Array.isArray(data.parts)) return cbErr(new Error('Bad collection parts'));

      var parts = data.parts.slice().sort(function (a, b) {
        var da = a.release_date || '9999-99-99';
        var db = b.release_date || '9999-99-99';
        return da.localeCompare(db);
      });

      var out = { name: normalizeCollectionName(data.name), parts: parts };
      partsSet(collectionId, out);
      cbOk(out);
    }, function (a, c) {
      if (c && c.status === 429) TMDB_DELAY = 1500;
      cbErr(c || a || new Error('TMDB error'));
    });
  }

  function buildMovieCard(item) {
    if (!item || !item.id) return null;
    if (!item.poster_path) return null;

    return {
      id: item.id,
      source: 'tmdb',
      media_type: 'movie',
      url: 'movie/' + item.id,
      ready: true,
      title: String(item.title || 'Untitled'),
      original_title: String(item.original_title || item.title || ''),
      overview: String(item.overview || ''),
      release_date: String(item.release_date || ''),
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: parseFloat(item.vote_average || 0),
      vote_count: parseInt(item.vote_count || 0),
      genre_ids: Array.isArray(item.genre_ids) ? item.genre_ids : [],
      original_language: item.original_language || ''
    };
  }

  function buildRow(collectionId, collectionName, parts) {
    var cfg = getCfg();

    var movies = (parts || [])
      .filter(function (p) {
        if (cfg.excludeAnime && p && p.original_language === 'ja') return false;
        if (cfg.excludeAnimation && p && p.genre_ids && p.genre_ids.indexOf(16) >= 0) return false;
        return true;
      })
      .slice(0, cfg.moviesPerRow)
      .map(buildMovieCard)
      .filter(Boolean);

    if (movies.length < 1) return null;

    return {
      title: normalizeCollectionName(collectionName),
      results: movies,
      collection_id: String(collectionId),
      total_results: parts ? parts.length : movies.length
    };
  }

  // ===== Random helpers (crypto if available) =====
  function randInt(max) {
    max = max | 0;
    if (max <= 1) return 0;
    try {
      if (window.crypto && window.crypto.getRandomValues) {
        var a = new Uint32Array(1);
        window.crypto.getRandomValues(a);
        return (a[0] % max) | 0;
      }
    } catch(e){}
    return (Math.random() * max) | 0;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = randInt(i + 1);
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  // ===== Session pool (rebuilds, BUT delivered anti-dup blocks repeats) =====
  function ensureSessionPool(index, session) {
    if (!session.pool || session.poolPos >= session.pool.length || session.poolIndexLen !== (index ? index.length : 0)) {
      var inflight = window.plugin_rand_rows_inflight;

      var pool = (index || [])
        .filter(function (it) { return it && it.id; })
        .filter(function (it) {
          var cid = String(it.id);
          if (deliveredHas(cid)) return false;
          if (inflight.has(cid)) return false;
          return true;
        });

      shuffle(pool);

      session.pool = pool;
      session.poolPos = 0;
      session.poolIndexLen = index ? index.length : 0;
    }
  }

  function nextFromPool(index, session) {
    ensureSessionPool(index, session);

    var inflight = window.plugin_rand_rows_inflight;

    while (session.poolPos < session.pool.length) {
      var it = session.pool[session.poolPos++];
      if (!it || !it.id) continue;

      var cid = String(it.id);
      if (deliveredHas(cid)) continue;
      if (inflight.has(cid)) continue;

      inflight.add(cid);
      return it;
    }

    return null;
  }

  // =========================================================
  // done() is called strictly once per batch
  // =========================================================
  function loadRowsBatchFromIndex(index, session, count, done) {
    var cfg = getCfg();
    var rows = [];
    var active = 0;
    var attempts = 0;

    var finished = false;
    function finishOnce() {
      if (finished) return;
      finished = true;
      done(rows);
    }

    function pump() {
      if (finished) return;

      if (rows.length >= count) return finishOnce();
      if (attempts >= MAX_ATTEMPTS_PER_BATCH && active === 0) return finishOnce();

      while (!finished && active < cfg.concurrency && rows.length < count && attempts < MAX_ATTEMPTS_PER_BATCH) {
        attempts++;

        var colMeta = nextFromPool(index, session);
        if (!colMeta) {
          if (rows.length === 0) {
            try { Lampa.Noty.show('Уникальные коллекции закончились'); } catch(e){}
          }
          return finishOnce();
        }

        let cid = String(colMeta.id);
        active++;

        fetchCollectionParts(cid, function (col) {
          if (finished) {
            window.plugin_rand_rows_inflight.delete(cid);
            return;
          }

          var row = null;
          if (col && col.parts && col.parts.length >= cfg.minParts) {
            row = buildRow(cid, col.name, col.parts);
          }

          deliveredAdd(cid);
          if (row) rows.push(row);

          window.plugin_rand_rows_inflight.delete(cid);
          active--;

          if (rows.length >= count) return finishOnce();
          setTimeout(pump, TMDB_DELAY);

        }, function () {
          if (finished) {
            window.plugin_rand_rows_inflight.delete(cid);
            return;
          }

          // Ошибка TMDB/сети: не помечаем коллекцию как delivered,
          // чтобы её можно было попробовать загрузить позже.
          window.plugin_rand_rows_inflight.delete(cid);
          active--;

          setTimeout(pump, TMDB_DELAY);
        });
      }
    }

    pump();
  }

  // ===== SOURCE =====
  // main executes only once, after that only more()
  var RowsSource = {
    _key: 'rf_fixed_session',

    _getSession: function () {
      var k = RowsSource._key;
      var s = window.plugin_rand_rows_session[k];
      if (!s) {
        s = window.plugin_rand_rows_session[k] = {
          loads: 0,
          pool: null,
          poolPos: 0,
          poolIndexLen: 0,
          loading: false,
          started: false
        };
      }
      return s;
    },

    main: function (params, onComplete, onError) {
      var session = RowsSource._getSession();

      if (session.started) return onComplete([]);
      session.started = true;

      if (session.loading) return onComplete([]);
      session.loading = true;

      getIndex(function (index) {
        var cfg = getCfg();
        loadRowsBatchFromIndex(index, session, cfg.rowsPerPage, function (newRows) {
          session.loads++;
          session.loading = false;
          onComplete(newRows);
        });
      }, function (e) {
        session.loading = false;
        onError && onError(e);
      }, false);
    },

    more: function (params, onComplete, onError) {
      var session = RowsSource._getSession();

      if (session.loading) return onComplete([]);
      session.loading = true;

      getIndex(function (index) {
        var cfg = getCfg();
        loadRowsBatchFromIndex(index, session, cfg.rowsPerPage, function (newRows) {
          session.loads++;
          session.loading = false;
          onComplete(newRows);
        });
      }, function (e) {
        session.loading = false;
        onError && onError(e);
      }, false);
    },

    get: function (params, onComplete, onError) {
      RowsSource.more(params, onComplete, onError);
    }
  };

  // ===== Menu + Settings =====
  function menuIconSvg() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>' +
      '<circle cx="9" cy="9" r="1"></circle>' +
      '<circle cx="15" cy="15" r="1"></circle>' +
      '<circle cx="15" cy="9" r="1"></circle>' +
      '<circle cx="9" cy="15" r="1"></circle>' +
    '</svg>';
  }

  function addMenuItemOnce() {
    var list = $('.menu .menu__list').eq(0);
    if (!list.length) return false;
    if (list.find('[data-action="random_franchise_rows"]').length) return true;

    var el = $(
      '<li class="menu__item selector" data-action="random_franchise_rows">' +
        '<div class="menu__ico">' + menuIconSvg() + '</div>' +
        '<div class="menu__text">Случайные франшизы</div>' +
      '</li>'
    );

    el.on('hover:enter', function () {
      window.plugin_rand_rows_session[RowsSource._key] = {
        loads: 0,
        pool: null,
        poolPos: 0,
        poolIndexLen: 0,
        loading: false,
        started: false
      };

      Lampa.Activity.push({
        component: 'main',
        source: SOURCE_ROWS,
        title: 'Случайные франшизы',
        url: RowsSource._key
      });
    });

    list.append(el);
    return true;
  }

  function addSettings() {
    if (!Lampa.SettingsApi) return;

    Lampa.SettingsApi.addComponent({
      component: CFG_COMP,
      name: 'Случайные франшизы',
      icon: menuIconSvg()
    });

    Lampa.SettingsApi.addParam({
      component: CFG_COMP,
      param: { name: K_EXCLUDE_ANIME, type: 'trigger', default: true },
      field: { name: 'Исключить аниме (JA)' }
    });

    Lampa.SettingsApi.addParam({
      component: CFG_COMP,
      param: { name: K_EXCLUDE_ANIM, type: 'trigger', default: false },
      field: { name: 'Исключить анимацию (16)' }
    });

    Lampa.SettingsApi.addParam({
      component: CFG_COMP,
      param: { name: K_ROWS_PER_PAGE, type: 'select', values: { '8':'8','12':'12','18':'18','24':'24','30':'30' }, default:'18' },
      field: { name: 'Франшиз за подгрузку' }
    });

    Lampa.SettingsApi.addParam({
      component: CFG_COMP,
      param: { name: K_MOVIES_PER_ROW, type: 'select', values: { '10':'10','20':'20','30':'30' }, default:'20' },
      field: { name: 'Фильмов в строке' }
    });

    Lampa.SettingsApi.addParam({
      component: CFG_COMP,
      param: { name: K_CONCURRENCY, type: 'select', values: { '2':'2','3':'3','5':'5' }, default:'5' },
      field: { name: 'Параллельность (TMDB)' }
    });

    // Reload index (force fetch)
    Lampa.SettingsApi.addParam({
      component: CFG_COMP,
      param: { name: K_RELOAD_INDEX, type: 'button' },
      field: { name: 'Обновить индекс с парсера', description: 'Перекачать /collectionsIndex и записать в Storage' },
      onRender: function (item) {
        item.on('hover:enter', function () {
          if(STATUS_URL){ fetchJson(STATUS_URL, function () {}, function () {}); }
          getIndex(function (idx) {
            Lampa.Noty.show('Индекс обновлён: ' + idx.length);
          }, function () {
            Lampa.Noty.show('Ошибка загрузки индекса');
          }, true);
        });
      }
    });

    // Reset
    Lampa.SettingsApi.addParam({
      component: CFG_COMP,
      param: { name: K_RESET_TRIGGER, type: 'button' },
      field: { name: 'Сбросить антидубли/кэш', description: 'Очистить partsCache + delivered + inflight + индекс в Storage' },
      onRender: function (item) {
        item.on('hover:enter', function () {
          partsCache = {};
          window.plugin_rand_rows_inflight = new Set();
          window.plugin_rand_rows_session = {};
          clearIndexStorage();
          deliveredClear();
          Lampa.Noty.show('Сброшено');
        });
      }
    });
  }

  // ===== Start =====
  function startPlugin() {
    Lampa.Api.sources[SOURCE_ROWS] = RowsSource;
    addSettings();

    function waitMenu() {
      if (!addMenuItemOnce()) return setTimeout(waitMenu, 500);
    }
    waitMenu();
  }

  if (window.appready) startPlugin();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });

})();