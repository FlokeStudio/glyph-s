#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lib = path.join(root, 'lib');

function stripExports(src) {
  return src.replace(/^export /gm, '');
}

const tokenize = await fs.readFile(path.join(lib, 'tokenize.js'), 'utf8');
const layout = await fs.readFile(path.join(lib, 'layout.js'), 'utf8');
const engine = await fs.readFile(path.join(lib, 'engine.js'), 'utf8');

const stripped = [
  stripExports(tokenize),
  stripExports(layout),
  engine
    .replace(/import \{[^}]+\} from '\.\/tokenize\.js';?\n?/, '')
    .replace(/import \{[^}]+\} from '\.\/layout\.js';?\n?/, '')
    .replace(/^export /gm, ''),
].join('\n');

const out = `/* Glyph Search 2.3-O — layout + translit (glyph-sO model) */
(function () {
${stripped}
  globalThis.GlyphS = {
    parseSearchQuery,
    tokenizeQuery,
    expandTokenVariants,
    expandQueryVariants,
    matchesSearchFilters,
    scoreSearchItem,
    snippetForItem,
    rankSearchItems,
    buildIndex,
    createSearchEngine,
    chunkPlainText,
  };
  function chunkPlainText(text, maxLen = 480) {
    const t = String(text || '').replace(/\\s+/g, ' ').trim();
    if (!t) return [];
    if (t.length <= maxLen) return [t];
    const out = [];
    let rest = t;
    while (rest.length > maxLen) {
      let cut = rest.lastIndexOf('. ', maxLen);
      if (cut < maxLen * 0.35) cut = rest.lastIndexOf(' ', maxLen);
      if (cut < maxLen * 0.25) cut = maxLen;
      out.push(rest.slice(0, cut).trim());
      rest = rest.slice(cut).trim();
    }
    if (rest) out.push(rest);
    return out;
  }
})();
`;

const dest = path.resolve(root, '../Floke/docs/assets/glyph-search-2.7.js');
await fs.mkdir(path.dirname(dest), { recursive: true });
await fs.writeFile(dest, out, 'utf8');
console.log('Wrote', dest);
