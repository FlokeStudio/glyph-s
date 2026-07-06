const DEFAULT_DB = 'glyph-search-v1';
const DEFAULT_STORE = 'corpus';

export function openSearchDB(name = DEFAULT_DB, version = 1) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = () => req.result.createObjectStore(DEFAULT_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function persistSearchCorpus(data, opts = {}) {
  const store = opts.store || DEFAULT_STORE;
  try {
    const db = await openSearchDB(opts.db);
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put({ at: Date.now(), ...data }, 'main');
  } catch {
  }
}

export async function loadSearchCorpus(opts = {}) {
  const store = opts.store || DEFAULT_STORE;
  try {
    const db = await openSearchDB(opts.db);
    return await new Promise((resolve, reject) => {
      const r = db.transaction(store).objectStore(store).get('main');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  } catch {
    return null;
  }
}

export function pushSearchHistory(q, opts = {}) {
  if (!String(q || '').trim()) return;
  const key = opts.historyKey || 'glyph-search-history';
  const max = opts.maxHistory ?? 10;
  const hist = JSON.parse(localStorage.getItem(key) || '[]').filter((x) => x !== q);
  hist.unshift(q);
  localStorage.setItem(key, JSON.stringify(hist.slice(0, max)));
}

export function readSearchHistory(opts = {}) {
  const key = opts.historyKey || 'glyph-search-history';
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}
