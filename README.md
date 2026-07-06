<p align="center">
  <img src="docs/assets/glyph-transparent.png" width="88" alt="Glyph" />
</p>

<h1 align="center">glyph-s 2.7</h1>

<p align="center">
  <strong>Glyph Core Search Engine</strong><br>
  Universal offline-first ranking for the Glyph family
</p>

<p align="center">
  <a href="https://flokestudio.github.io/glyph-s/">Site</a> ·
  <a href="https://github.com/FlokeStudio/glyph-sO">glyph-sO</a> ·
  <a href="https://github.com/FlokeStudio/glyph-miO">glyph-miO</a> ·
  <a href="https://github.com/krwg/glyph-mi">glyph-mi</a>
</p>

---

## User section

### What is glyph-s?

**glyph-s** is the shared **search engine** behind the Glyph product family. It ranks text items — notes, pages, tracks, actions — by relevance to a query, with snippet extraction and fuzzy matching for keyboard layout and transliteration.

If you use [**glyph-sO**](https://github.com/FlokeStudio/glyph-sO) in Obsidian, you’re already using glyph-s under the hood. This repository is the **source of truth** for that engine.

### Who is this for?

| Audience | What you get |
|----------|--------------|
| **Obsidian users** | Install [glyph-sO](https://github.com/FlokeStudio/glyph-sO) — no need to touch this repo |
| **Floke / web developers** | Pre-built browser bundle (`glyph-search-2.7.js`) |
| **Plugin / app developers** | ESM or CJS import with full API control |

### What’s new in 2.7

**Search profiles** — three presets that tune the speed vs. quality tradeoff:

| Profile | Fuzzy cutoff | Score scale | Max candidates | When to use |
|---------|-------------|-------------|----------------|-------------|
| `legacy` | 0.40 | 1.00 | 8 000 | Match pre-2.7 behavior |
| `balanced` | 0.48 | 1.08 | 4 000 | Default for daily use |
| `max-quality` | 0.35 | 1.16 | 9 000 | Maximum recall, larger vaults |

**Extended query grammar** via `parseSearchQuery()`:

```
"deep work"              → phrase (contiguous match)
-draft                   → exclude token
path:projects/           → path prefix filter
tag:evergreen            → tag filter (# optional)
(idea OR draft)          → OR group
type:note page:docs      → structured filters
```

**New high-level API:**

- `createSearchEngine(options)` — build a reusable search instance with `.search(query)`
- `buildIndex(items, opts)` — pre-compute text bags for faster repeated queries

**Performance improvements:**

- Token-variant cache (layout + transliteration expansions memoized per profile)
- Snippet cache (avoid re-generating previews for the same item + query)
- Fast-path candidate filtering before full scoring
- Diagnostics hook: `onDiagnostics({ candidateCount, scoredCount, outputCount, elapsedMs })`

**Dual output bundles:**

| Bundle | Output | Consumer |
|--------|--------|----------|
| `npm run bundle:obsidian` | `dist/glyph-search-cjs.js` | glyph-sO `vendor/engine.js` |
| `npm run bundle:floke` | `glyph-search-2.7.js` | Floke web (`globalThis.GlyphS`) |

### Ranking behavior

Each searchable item provides:

- `title()` — primary label
- `sub` — secondary text (path, subtitle)
- `keys` — additional index keys
- `body()` — full text content
- `cat` — category (`note`, `page`, `app`, `release`, `action`, `news`)

Scoring considers token hits in title (highest weight), keys, sub, and body. Fuzzy bigram overlap catches near-misses. Category priority boosts pages and notes over lower-priority types.

### Fuzzy matching

Enabled by default via `SEARCH_SETTINGS`:

- **Layout fix** — EN↔RU keyboard swap (e.g. `ghbdtn` → `привет`)
- **Transliteration** — rough Latin↔Cyrillic (e.g. `privet` → `привет`)

Both can be disabled per-query via `settings` in `rankSearchItems()`.

---

## GitHub / Dev section

### Install & build

```bash
git clone https://github.com/FlokeStudio/glyph-s.git
cd glyph-s
npm run build          # both bundles
# or separately:
npm run bundle:obsidian
npm run bundle:floke
```

No runtime dependencies. Pure JavaScript (ESM source, CJS bundle via custom script).

### API reference

#### `createSearchEngine(options)`

```js
import { createSearchEngine } from './lib/index.js';

const engine = createSearchEngine({
  profile: 'balanced',          // default profile
  limit: 12,                    // max results per search
  items: [/* searchable items */],
  settings: { fuzzyLayout: true, fuzzyTransliteration: true },
  onDiagnostics: (d) => console.log(d),
});

const results = engine.search('alpha project');
const deep    = engine.search('alpha', { profile: 'max-quality', limit: 50 });
```

#### `rankSearchItems(items, query, runtime)`

Lower-level API used by Obsidian plugin adapter:

```js
import { rankSearchItems, parseSearchQuery, snippetForItem } from './lib/index.js';

const filters = parseSearchQuery('tag:evergreen "deep work" -draft');
const ranked = rankSearchItems(items, 'deep work', {
  limit: 20,
  profile: 'balanced',
  settings: { fuzzyLayout: true },
  onDiagnostics: (stats) => { /* ... */ },
});
```

#### `buildIndex(items, opts)`

Pre-compute text bags for items. Useful when the same index is searched many times:

```js
import { buildIndex } from './lib/index.js';

const index = buildIndex(items, { profile: 'balanced' });
// index.items[].bag — pre-tokenized text for fast-path filtering
```

### Project structure

```
lib/
  engine.js       # rankSearchItems, createSearchEngine, buildIndex, caching
  tokenize.js     # tokenizeQuery, parseSearchQuery (grammar)
  layout.js       # expandTokenVariants, expandQueryVariants (fuzzy)
  index.js        # public ESM exports
scripts/
  bundle-cjs.mjs  # Obsidian CJS bundle
  bundle-floke.mjs # browser global bundle
docs/
  index.html      # GitHub Pages landing
  assets/         # glyph logo
```

### Exported symbols

| Export | Module | Description |
|--------|--------|-------------|
| `createSearchEngine` | engine.js | High-level search instance |
| `buildIndex` | engine.js | Pre-computed index builder |
| `rankSearchItems` | engine.js | Core ranking function |
| `snippetForItem` | engine.js | Context snippet for a match |
| `parseSearchQuery` | tokenize.js | Extended query parser |
| `tokenizeQuery` | tokenize.js | Simple whitespace tokenizer |
| `expandTokenVariants` | layout.js | Layout + transliteration variants |
| `expandQueryVariants` | layout.js | Full query expansion |
| `matchesSearchFilters` | engine.js | Filter predicate |
| `scoreSearchItem` | engine.js | Single-item scorer |

### Integration checklist

1. Build CJS: `npm run bundle:obsidian`
2. Copy `dist/glyph-search-cjs.js` to consumer’s `vendor/engine.js`
3. Call `rankSearchItems(items, query, { profile, limit, settings })`
4. Display `snippetForItem(item, query, settings)` in result UI

### Related repositories

| Repo | Role |
|------|------|
| [glyph-sO](https://github.com/FlokeStudio/glyph-sO) | Obsidian search plugin (vendors this engine) |
| [glyph-miO](https://github.com/FlokeStudio/glyph-miO) | Obsidian metadata intelligence |
| [glyph-mi](https://github.com/krwg/glyph-mi) | Universal metadata intelligence core |

### License

GPL-3.0-or-later · Floke Studio
