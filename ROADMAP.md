# Glyph Search — technical roadmap

Prioritized engineering backlog after the 2.8.0 tooling pass. See also [DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Current strengths

- Shared engine for Cultiva, Obsidian (sO), Floke web, and future products
- CJS vendor bundle + `npm run vendor:sync` with `VERSION.json` stamp
- Search profiles: `legacy` / `balanced` / `max-quality`
- Vitest ranking snapshots + expanded query / layout / engine tests
- `tsconfig.json`, ESLint flat config, benchmark script (`npm run benchmark`)
- Embeddings stub (`lib/embeddings.js`) — semantic search hook, disabled by default

## Priority backlog

### Week 1 (Obsidian UX — user-visible)

| Repo | Item | Status |
|------|------|--------|
| **glyph-sO** | Persistent vault index (`index-cache.json`, mtime invalidation) | **2.7.3** |
| **glyph-miO** | Theme-safe CSS (Obsidian variables only, no hex fallbacks) | **2.7.3** |

### Week 2

| Repo | Item | Status |
|------|------|--------|
| **glyph-sO** | Highlight match in open note after jump (`editor.setCursor` + scroll) | **2.8.0** |
| **glyph-miO** | Right sidebar `ItemView` instead of Modal-only panel | **2.8.0** |

### Week 3

| Repo | Item | Status |
|------|------|--------|
| **glyph-mi** | Publish `@floke/glyph-mi` on npm | package prep **2.8.0**; registry publish next |

### Month 2

| Repo | Item | Status |
|------|------|--------|
| **glyph-s** | TypeScript (`tsconfig.json`, typed public API) | **shipped 2.8.0** (checkJs) |
| **glyph-s** | Benchmark suite (1k / 5k / 10k items, document in README) | **shipped 2.8.0** |
| **glyph-s** | Expand engine test matrix (query AST, fuzzy EN↔RU, edge cases) | **shipped 2.8.0** |
| **glyph-s** | Optional local embeddings (ONNX all-MiniLM, offline) | stub **2.8.0**; ONNX next |
| **glyph-mi** | Train + ship `.onnx` from `glyph-log.sqlite` (500+ examples) | |
| **glyph-mi** | KNN in main process via IPC (not renderer at 10k tracks) | module **2.8.0**; Electron wire next |
| **glyph-miO** | YAML frontmatter tag mode | **2.8.0** |
| **glyph-miO** | Batch vault analysis (“148 notes without tags”) | **2.8.0** |
| **glyph-sO** | Folder grouping toggle, hover preview, default hotkey polish | **2.8.0** |

## Engine (`glyph-s`)

### TypeScript

`tsconfig.json` with `allowJs` + `checkJs` shipped in **2.8.0**. Next: `.d.ts` public types or migrate core modules to `.ts` without breaking the CJS bundle.

### Tests (expand)

**Shipped 2.8.0:**

- `parseSearchQuery('path:projects tag:daily')` → structured filters
- Fuzzy EN↔RU (`ghbdtn` → `привет`)
- Edge cases: empty query, phrases, exclusions, OR groups
- `buildIndex`, `createSearchEngine.search`, `snippetForItem`

### Benchmark

**Shipped 2.8.0** — `scripts/benchmark.mjs` with `performance.now()` on 1k / 5k / 10k items. Run `npm run benchmark` and paste numbers into README when publishing.

### Semantic similarity (optional)

TF-IDF / BM25-style ranking today. **2.8.0** ships `lib/embeddings.js` stub (`embedTexts` → `null`, `embeddingBoost` → `0`). Next: optional ONNX embeddings (all-MiniLM ~23MB, no Ollama).

## One-line priority

**Obsidian UX shipped in 2.8** — next: ONNX embeddings, npm publish, Electron KNN wiring.
