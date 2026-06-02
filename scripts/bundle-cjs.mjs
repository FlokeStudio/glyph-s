#!/usr/bin/env node
/** Emit CJS vendor bundles for Obsidian plugins. */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lib = path.join(root, 'lib');

function toCjs(src, exportNames) {
  let s = src.replace(/^export /gm, '');
  s = s.replace(/import \{([^}]+)\} from '\.\/[^']+';?\n?/g, '');
  const exp = exportNames.map((n) => `  ${n}`).join(',\n');
  return `${s}\nmodule.exports = {\n${exp}\n};\n`;
}

const tokenize = await fs.readFile(path.join(lib, 'tokenize.js'), 'utf8');
const ollama = await fs.readFile(path.join(lib, 'ollama.js'), 'utf8');
const engineRaw = await fs.readFile(path.join(lib, 'engine.js'), 'utf8');

const tokenizeCjs = toCjs(tokenize, ['tokenizeQuery', 'parseSearchQuery']);
const ollamaCjs = toCjs(ollama, [
  'DEFAULT_OLLAMA_URL',
  'DEFAULT_OLLAMA_MODEL',
  'parseJsonLoose',
  'ollamaAvailable',
  'ollamaGenerate',
  'ollamaJson',
]);

const engineCjs =
  tokenizeCjs.replace(/module\.exports[\s\S]*$/, '') +
  engineRaw
    .replace(/import \{[^}]+\} from '\.\/tokenize\.js';?\n?/, '')
    .replace(/^export /gm, '') +
  '\nmodule.exports = {\n  tokenizeQuery,\n  parseSearchQuery,\n  matchesSearchFilters,\n  scoreSearchItem,\n  snippetForItem,\n  rankSearchItems,\n};\n';

const targets = [
  path.resolve(root, '../glyph-miO/vendor'),
  path.resolve(root, '../glyph-sO/vendor'),
];
for (const dir of targets) {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'ollama.cjs'), ollamaCjs, 'utf8');
  await fs.writeFile(path.join(dir, 'engine.cjs'), engineCjs, 'utf8');
  console.log('Wrote vendor →', dir);
}
