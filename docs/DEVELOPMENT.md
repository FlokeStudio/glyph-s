# Development notes

## Tests

```bash
npm install
npm test              # vitest run — ranking / fuzzy / profile snapshots
npm run test:watch
```

Corpus fixtures live in `test/helpers.js`. Order snapshots for `rankSearchItems` are intentional — update them deliberately when scoring changes.

## Vendor sync (Obsidian plugins)

Do **not** manually `cp` the CJS bundle into plugin trees. From this repo (with sibling checkouts):

```bash
npm run vendor:sync   # alias: npm run bundle:obsidian
```

Writes into:

- `../glyph-sO/vendor/` — `engine.js`, `engine.cjs`, `ollama.*`, `profiles.json`, `VERSION.json`
- `../glyph-miO/vendor/` — same set
- `dist/glyph-search-cjs.js` + `dist/VERSION.json` (local artifact; gitignored)

`VERSION.json` stamps `name`, `version` (glyph-s semver), `stampedAt`, and file list so plugins can show which engine they vendored.

## Search profiles

Source of truth: `lib/profiles.json` mirrored by `lib/profiles.js` (`PROFILE_SETTINGS`, `getProfileConfig`). Engine API is unchanged — pass `profile: 'legacy' | 'balanced' | 'max-quality'`.

## onDiagnostics (glyph-sO debug panel)

```js
rankSearchItems(items, query, {
  profile: 'balanced',
  onDiagnostics: (d) => {
    // d.profile, inputCount, candidateCount, scoredCount, outputCount, elapsedMs
  },
});
```

Wire the callback into the Obsidian debug / status UI to surface candidate vs scored counts and latency.

## Roadmap (not in 2.7.2)

- **Incremental index** — update bags for changed items without full `buildIndex` rebuild. Callers should keep using full rebuild until that lands.
