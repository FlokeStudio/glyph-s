#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lib = path.join(root, 'lib');
const tokenize = await fs.readFile(path.join(lib, 'tokenize.js'), 'utf8');
const engine = await fs.readFile(path.join(lib, 'engine.js'), 'utf8');
const stripped = [
  tokenize.replace(/^export /gm, ''),
  engine.replace(/import \{[^}]+\} from '\.\/tokenize\.js';?\n?/, '').replace(/^export /gm, ''),
].join('\n');
const out = `/* Glyph Search 2.3-O */\n(function () {\n${stripped}\n  globalThis.GlyphS = {\n    parseSearchQuery,\n    tokenizeQuery,\n    matchesSearchFilters,\n    scoreSearchItem,\n    snippetForItem,\n    rankSearchItems,\n  };\n})();\n`;
const dest = path.resolve(root, '../Floke/docs/assets/glyph-search-2.3.js');
await fs.mkdir(path.dirname(dest), { recursive: true });
await fs.writeFile(dest, out, 'utf8');
console.log('Wrote', dest);
