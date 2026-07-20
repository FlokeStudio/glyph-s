# Glyph Search — technical roadmap

Prioritized engineering backlog after the 2.7.2 correctness pass. See also [DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Current strengths

- Shared engine for Cultiva, Obsidian (sO), Floke web, and future products
- CJS vendor bundle + `npm run vendor:sync` with `VERSION.json` stamp
- Search profiles: `legacy` / `balanced` / `max-quality`
- Vitest ranking snapshots (14 tests) including body-only full-text regression

## Priority backlog

### Week 1 (Obsidian UX — user-visible)

| Repo | Item | Status |
|------|------|--------|
| **glyph-sO** | Persistent vault index (`index-cache.json`, mtime invalidation) | **2.7.3** |
| **glyph-miO** | Theme-safe CSS (Obsidian variables only, no hex fallbacks) | **2.7.3** |

### Week 2

| Repo | Item |
|------|------|
| **glyph-sO** | Highlight match in open note after jump (`editor.setCursor` + scroll) |
| **glyph-miO** | Right sidebar `ItemView` instead of Modal-only panel |

### Week 3

| Repo | Item |
|------|------|
| **glyph-mi** | Publish `@floke/glyph-mi` on npm |
| **glyph-s** | Expand engine test matrix (query AST, fuzzy EN↔RU, edge cases) |

### Month 2

| Repo | Item |
|------|------|
| **glyph-s** | TypeScript (`tsconfig.json`, typed public API) |
| **glyph-s** | Benchmark suite (1k / 5k / 10k items, document in README) |
| **glyph-s** | Optional local embeddings (ONNX all-MiniLM, offline) |
| **glyph-mi** | Train + ship `.onnx` from `glyph-log.sqlite` (500+ examples) |
| **glyph-mi** | KNN in main process via IPC (not renderer at 10k tracks) |
| **glyph-miO** | YAML frontmatter tag mode |
| **glyph-miO** | Batch vault analysis (“148 notes without tags”) |
| **glyph-sO** | Folder grouping toggle, hover preview, default hotkey polish |

## Engine (`glyph-s`)

### TypeScript

Add `tsconfig.json` and public types for `rankSearchItems`, `snippetForItem`, `createSearchEngine` — IDE autocomplete and compile-time checks without breaking the CJS bundle.

### Tests (expand)

Already covered: profile order, body-only fast-path, layout fuzzy.

Add:

- `parseSearchQuery('path:projects tag:daily')` → structured filters
- Fuzzy EN↔RU (`ghbdtn` → `привет`)
- Edge cases: empty query, stop-words-only

### Benchmark

Script with `performance.now()` or Benchmark.js on 1000 / 5000 / 10000 items; publish numbers in README.

### Semantic similarity (optional)

TF-IDF / BM25-style ranking today. Next level: optional ONNX embeddings (all-MiniLM ~23MB, no Ollama).

## One-line priority

**Obsidian plugins need a persistent index and a sidebar panel first** — everything else is quality that compounds over time.
