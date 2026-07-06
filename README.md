# glyph-s 2.7

Universal offline-first search engine for Glyph products.

[Site](https://flokestudio.github.io/glyph-s/) · [glyph-sO](https://github.com/FlokeStudio/glyph-sO) · [glyph-miO](https://github.com/FlokeStudio/glyph-miO)

## User section

- `glyph-s` powers fast search in the Glyph family.
- v2.7 adds profile-based ranking: `legacy`, `balanced`, `max-quality`.
- Works locally by default; optional Ollama enrichment is still available.

## GitHub / Dev section

### What is new in 2.7

- Added `createSearchEngine()` and `buildIndex()` APIs.
- Added diagnostics hook support in `rankSearchItems`.
- Added cached token-variant expansion and snippet caching.
- Added extended query parsing support (phrases, exclude tokens, OR groups).

### Build

```bash
npm run build
```

or separately:

```bash
npm run bundle:obsidian
npm run bundle:floke
```

### API quick start

```js
import { createSearchEngine } from './lib/index.js';

const engine = createSearchEngine({
  items: [{ cat: 'note', title: () => 'Alpha', sub: 'docs/a.md', keys: ['alpha'], body: () => 'alpha beta' }],
  profile: 'balanced',
});

const results = engine.search('alpha');
```

### Related repos

- [glyph-mi](https://github.com/krwg/glyph-mi)
- [glyph-miO](https://github.com/FlokeStudio/glyph-miO)
- [glyph-sO](https://github.com/FlokeStudio/glyph-sO)

krwg · [GPL-3.0](LICENSE)
