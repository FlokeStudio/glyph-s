# Glyph-S 2.3-O / 2.3-On

**Universal offline-first search** for Floke products — ranking engine, optional Ollama enrichment, IndexedDB corpus helpers.

<p>
  <img src="https://img.shields.io/badge/version-2.3.0-blue" alt="version" />
  <img src="https://img.shields.io/badge/2.3--O-offline-green" alt="offline" />
  <img src="https://img.shields.io/badge/2.3--On-Ollama-optional-111" alt="on" />
  <a href="https://github.com/FlokeStudio/glyph-s/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-orange" alt="license" /></a>
</p>

| Mode | Meaning |
|------|---------|
| **2.3-O** | Bigram-fuzzy scoring, filter tokens, history — no network |
| **2.3-On** | Optional `ollamaJson()` for query expansion or suggestions |

## Consumers

| Target | How |
|--------|-----|
| **Floke landing** | `npm run bundle:floke` → `Floke/docs/assets/glyph-search-2.3.js` |
| **glyph-sO** (Obsidian) | `npm run bundle:obsidian` → `vendor/*.cjs` |
| **glyph-miO** (Obsidian) | same bundle (Ollama helper) |

## API (ES modules)

```js
import { rankSearchItems, scoreSearchItem, parseSearchQuery } from './lib/engine.js';
import { ollamaAvailable, ollamaJson } from './lib/ollama.js';

const items = [{ cat: 'note', title: () => 'My Note', sub: 'path', keys: [], body: () => 'content' }];
const ranked = rankSearchItems(items, 'my note', { limit: 12 });
```

## Build

```bash
npm run bundle:floke
npm run bundle:obsidian
```

## Optional: Ollama

```bash
ollama pull llama3.2
ollama serve   # http://127.0.0.1:11434
```

```js
import { ollamaJson } from './lib/ollama.js';
const out = await ollamaJson({
  prompt: 'Reply JSON: {"q":"keywords"} for search: cultiva changelog',
}, { model: 'llama3.2' });
```

## Related repos

- [glyph-mi](https://github.com/FlokeStudio/glyph-mi) — Senza metadata intelligence  
- [glyph-miO](https://github.com/FlokeStudio/glyph-miO) — Obsidian MI plugin  
- [glyph-sO](https://github.com/FlokeStudio/glyph-sO) — Obsidian search plugin  

---

Floke Studio · [GPL-3.0](LICENSE)
