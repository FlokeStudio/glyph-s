import { rankSearchItems, snippetForItem } from '../engine.js';
import {
  loadSearchCorpus,
  persistSearchCorpus,
  pushSearchHistory,
  readSearchHistory,
} from '../corpus-idb.js';
import { ollamaAvailable, ollamaJson } from '../../../core/src/ollama.js';

export function createGlyphSearchPalette(config) {
  const {
    paletteEl,
    inputEl,
    listEl,
    getItems,
    pins = [],
    t = (k) => k,
    esc = (s) => String(s),
    onRun,
    historyKey = 'glyph-search-history',
    mode = 'offline',
    ollamaOptions = {},
  } = config;

  let items = [];
  let active = 0;
  let open = false;

  function render(q) {
    if (!listEl) return;
    let scored = rankSearchItems(items, q, { limit: 12 });
    const tokens = q.trim().toLowerCase().split(/[\s#./_-]+/).filter(Boolean);

    if (!q.trim()) {
      const hist = readSearchHistory({ historyKey }).slice(0, 5).map((h) => ({
        it: {
          title: () => h,
          sub: t('cmd.history') || 'history',
          hash: '',
          cat: 'action',
          keys: [h],
          run: () => {
            inputEl.value = h;
            render(h);
          },
        },
        score: 100,
      }));
      const pinItems = pins.map((p) => ({
        it: {
          title: () => p.label,
          sub: p.hash,
          hash: p.hash,
          cat: 'page',
          keys: [p.label],
        },
        score: 200,
      }));
      scored = [...pinItems, ...hist, ...scored].slice(0, 12);
    }

    if (!scored.length) {
      listEl.innerHTML = `<li class="cmd-empty">${esc(t('cmd.empty') || 'No results')}</li>`;
      listEl._filtered = [];
      return;
    }

    listEl.innerHTML = scored
      .map(({ it }, i) => {
        const snip = snippetForItem(it, tokens, esc);
        const pinMark = pins.some((p) => p.hash === it.hash) ? `<span class="cmd-pin">★</span>` : '';
        return `<li class="cmd-item${i === active ? ' active' : ''}" role="option" data-idx="${i}" data-hash="${esc(it.hash || '')}" data-run="${it.run ? '1' : ''}">
      <div class="cmd-item-body"><div class="cmd-item-title">${esc(it.title())}${pinMark}</div><div class="cmd-item-sub">${esc(it.sub || '')}</div>${snip ? `<div class="cmd-item-snippet">${snip}</div>` : ''}</div>
      <div class="cmd-item-key">${esc(t('cmd.cat.' + (it.cat || 'page')) || it.cat || '')}</div>
    </li>`;
      })
      .join('');
    listEl._filtered = scored.map((x) => x.it);
    listEl.querySelectorAll('.cmd-item').forEach((el) => {
      el.addEventListener('click', () => runItem(listEl._filtered[+el.dataset.idx]));
    });
  }

  function runItem(it) {
    const q = inputEl?.value;
    if (q) pushSearchHistory(q, { historyKey });
    close();
    if (it?.run) it.run();
    else if (it?.hash) onRun?.(it) ?? (location.hash = it.hash);
  }

  function openPalette() {
    items = typeof getItems === 'function' ? getItems() : [];
    active = 0;
    open = true;
    paletteEl.hidden = false;
    paletteEl.classList.add('open');
    inputEl.value = '';
    render('');
    inputEl.focus();
  }

  function close() {
    open = false;
    paletteEl.classList.remove('open');
    paletteEl.hidden = true;
  }

  async function enrichOnline(query) {
    if (mode !== 'online') return null;
    const ok = await ollamaAvailable(ollamaOptions);
    if (!ok) return null;
    return ollamaJson(
      {
        prompt: `User search: "${query}". Reply JSON: {"suggestions":["hash or label",...]}`,
      },
      ollamaOptions
    );
  }

  inputEl?.addEventListener('input', () => {
    active = 0;
    render(inputEl.value);
  });
  inputEl?.addEventListener('keydown', (e) => {
    const filtered = listEl?._filtered || [];
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = Math.min(active + 1, filtered.length - 1);
      render(inputEl.value);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = Math.max(active - 1, 0);
      render(inputEl.value);
    }
    if (e.key === 'Enter' && filtered[active]) runItem(filtered[active]);
  });
  paletteEl?.addEventListener('click', (e) => {
    if (e.target === paletteEl) close();
  });

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open ? close() : openPalette();
    }
  });

  return {
    open: openPalette,
    close,
    render,
    persistCorpus: (data) => persistSearchCorpus(data, { db: config.idbName }),
    loadCorpus: () => loadSearchCorpus({ db: config.idbName }),
    enrichOnline,
    isOpen: () => open,
  };
}
