# glyph-s Repository Note

`glyph-s` is the shared search engine for the Glyph family and Floke web assets.

- Main docs: `README.md`
- Site: https://flokestudio.github.io/glyph-s/
- Version: **2.7.1** (GPL-3.0-or-later)
- Core APIs: `buildIndex`, `createSearchEngine`, `rankSearchItems`, `parseSearchQuery`
- Profiles: `lib/profiles.js` + `lib/profiles.json` (`legacy` / `balanced` / `max-quality`)
- Types: JSDoc in `lib/types.js` (optional `jsconfig.json` `checkJs`)
- Tests: `npm test` (vitest ranking snapshots)
- Vendor sync: `npm run vendor:sync` → writes `../glyph-sO/vendor` and `../glyph-miO/vendor` plus `VERSION.json` (no manual `cp`)
- Build for Floke: `npm run bundle:floke`
- Build for Obsidian plugins: `npm run bundle:obsidian` (same as `vendor:sync`)
- Incremental index updates (partial rebuild on item change) — not shipped yet; use full `buildIndex` today
- Diagnostics: pass `onDiagnostics` to `rankSearchItems` / `createSearchEngine` for glyph-sO debug panel stats
