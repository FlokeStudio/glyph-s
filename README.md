<p align="center">
  <img src="docs/assets/glyph-transparent.png" width="88" alt="Glyph" />
</p>

<h1 align="center">glyph-s 2.8.0</h1>

<p align="center">
  <strong>Glyph Core Search Engine</strong><br>
  Universal offline-first ranking for the Glyph family
</p>

<p align="center">
  <a href="https://flokestudio.github.io/glyph-s/">Site</a> ·
  <a href="docs/DEVELOPMENT.md">Development</a> ·
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

### What's new in 2.8.0

**Tooling & quality**

- `tsconfig.json` with `allowJs` + `checkJs` for IDE type checking
- ESLint flat config (`npm run lint`)
- Expanded test matrix: query AST, fuzzy EN↔RU layout, engine helpers
- Benchmark script (`npm run benchmark`) — see numbers below

**Embeddings hook**

- `lib/embeddings.js` — optional semantic boost (`semanticEmbeddings: true` uses hash vectors; ONNX when `onnxruntime-node` + model path are configured)
- Public types in `lib/glyph-s.d.ts`

**Benchmark (2.8.0)**

Run locally:

```bash
npm run benchmark
```

| Items | Time (ms) |
|-------|-----------|
| 1 000 | run `npm run benchmark` |
| 5 000 | run `npm run benchmark` |
| 10 000 | run `npm run benchmark` |

### What’s new in 2.7.2

**Full-text fast-path fix** — candidate gating (`textBagForItem` / `shouldCandidatePassFastPath`) now includes note **body**, so terms that appear only in paragraphs reach scoring. Previously the bag was title + sub + keys only, which silently dropped body-only hits before `scoreSearchItem`.

**Index reuse** — `createSearchEngine().search()` passes the precomputed `buildIndex()` bags into `rankSearchItems` instead of rebuilding them every query.

### What’s new in 2.7 / 2.7.1

**Search profiles** — three presets that tune the speed vs. quality tradeoff (defined in `lib/profiles.json` / `lib/profiles.js`). Max candidates caps the post-filter scored pool (top-K), not which corpus indices are scanned:

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

**High-level API:**

- `createSearchEngine(options)` — reusable search instance with `.search(query)`
- `buildIndex(items, opts)` — pre-compute text bags for faster repeated queries

**2.7.1–2.7.2 tooling:**

- Vitest ranking snapshots (`npm test`), including a body-only full-text regression
- Automated vendor sync (`npm run vendor:sync`) with `VERSION.json` stamp
- JSDoc public API typedefs (`lib/types.js`) + optional `checkJs` via `jsconfig.json`

**Performance (2.7):**

- Token-variant cache, snippet cache, fast-path candidate filtering
- Diagnostics hook: `onDiagnostics({ candidateCount, scoredCount, outputCount, elapsedMs, … })` — intended for the glyph-sO debug panel

**Dual output bundles:**

| Bundle | Output | Consumer |
|--------|--------|----------|
| `npm run vendor:sync` | sibling `vendor/` + `dist/glyph-search-cjs.js` | glyph-sO / glyph-miO |
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

### Index updates

**Incremental index updates** (patch bags when a single item changes) are not shipped yet. Use full `buildIndex(items)` / recreate the engine when the corpus changes.

---

## GitHub / Dev section

### Install, test & build

```bash
git clone https://github.com/FlokeStudio/glyph-s.git
cd glyph-s
npm install
npm test                 # vitest — ranking, tokenize, layout, engine
npm run lint             # eslint lib test scripts
npm run benchmark        # 1k / 5k / 10k synthetic corpus timing
npm run build            # Obsidian vendor sync + Floke bundle
# or separately:
npm run vendor:sync      # preferred — writes sibling plugin vendors + VERSION.json
npm run bundle:obsidian  # same as vendor:sync
npm run bundle:floke
```

No runtime dependencies. Pure JavaScript (ESM source, CJS vendor via `scripts/bundle-cjs.mjs`). License: **GPL-3.0-or-later**.

### Vendor sync (replaces manual `cp`)

With `glyph-sO` and/or `glyph-miO` checked out next to this repo:

```bash
npm run vendor:sync
```

Writes `engine.js` / `engine.cjs`, `ollama.*`, `profiles.json`, and `VERSION.json` into:

- `../glyph-sO/vendor/`
- `../glyph-miO/vendor/`

Also writes `dist/glyph-search-cjs.js` (gitignored). Do not hand-copy the bundle.

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for details.

### API reference

#### `createSearchEngine(options)`

```js
import { createSearchEngine } from './lib/index.js';

const engine = createSearchEngine({
  profile: 'balanced',          // default profile
  limit: 12,                    // max results per search
  items: [/* searchable items */],
  settings: { fuzzyLayout: true, fuzzyTransliteration: true },
  onDiagnostics: (d) => console.log(d),  // glyph-sO debug panel
});

const results = engine.search('alpha project');
const deep    = engine.search('alpha', { profile: 'max-quality', limit: 50 });
```

#### `rankSearchItems(items, query, runtime)`

```js
import { rankSearchItems, parseSearchQuery, snippetForItem } from './lib/index.js';

const filters = parseSearchQuery('tag:evergreen "deep work" -draft');
const ranked = rankSearchItems(items, 'deep work', {
  limit: 20,
  profile: 'balanced',
  settings: { fuzzyLayout: true },
  onDiagnostics: (stats) => {
    // stats: profile, inputCount, candidateCount, scoredCount, outputCount, elapsedMs
  },
});
```

#### `buildIndex(items, opts)`

```js
import { buildIndex } from './lib/index.js';

const index = buildIndex(items, { profile: 'balanced' });
// index.items[].bag — pre-tokenized text for fast-path filtering
```

#### Types (checkJs)

Enable editor checking with the repo `tsconfig.json` (`allowJs`, `checkJs: true`).

### Project structure

```
lib/
  engine.js       # rankSearchItems, createSearchEngine, buildIndex
  profiles.js     # PROFILE_SETTINGS + getProfileConfig
  profiles.json   # same profile data (vendor stamp copy)
  types.js        # checkJs placeholder (public shapes documented in README)
  tokenize.js     # tokenizeQuery, parseSearchQuery
  layout.js       # fuzzy layout / transliteration
  embeddings.js   # optional semantic search stub (disabled by default)
  index.js        # public ESM exports
test/
  ranking.test.js     # vitest order snapshots
  tokenize.test.js    # query AST / filters
  layout.test.js      # EN↔RU keyboard variants
  engine-extra.test.js # buildIndex, engine, snippets
scripts/
  bundle-cjs.mjs  # vendor:sync → Obsidian CJS + VERSION.json
  bundle-floke.mjs
  benchmark.mjs   # 1k / 5k / 10k timing
docs/
  DEVELOPMENT.md  # tests, vendor sync, diagnostics
  index.html
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
| `getProfileConfig` / `PROFILE_SETTINGS` | profiles.js | Search profile presets |
| `expandTokenVariants` | layout.js | Layout + transliteration variants |
| `expandQueryVariants` | layout.js | Full query expansion |
| `embedTexts` / `embeddingBoost` | embeddings.js | Semantic search stub (disabled) |
| `matchesSearchFilters` | engine.js | Filter predicate |
| `scoreSearchItem` | engine.js | Single-item scorer |

### Integration checklist

1. Run `npm run vendor:sync` (from glyph-s, with plugin repos as siblings)
2. Confirm `vendor/VERSION.json` matches this package version
3. Call `rankSearchItems(items, query, { profile, limit, settings, onDiagnostics })`
4. Display `snippetForItem(item, query, settings)` in result UI

### Related repositories

| Repo | Role |
|------|------|
| [glyph-sO](https://github.com/FlokeStudio/glyph-sO) | Obsidian search plugin (vendors this engine) |
| [glyph-miO](https://github.com/FlokeStudio/glyph-miO) | Obsidian metadata intelligence |
| [glyph-mi](https://github.com/krwg/glyph-mi) | Universal metadata intelligence core |

### License

GPL-3.0-or-later · Floke Studio
