#!/usr/bin/env node
/**
 * Emit CJS vendor bundles for Obsidian plugins (glyph-sO / glyph-miO).
 * Replaces manual `cp dist/... vendor/engine.js` — run `npm run vendor:sync`.
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lib = path.join(root, 'lib');
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));

function toCjs(src, exportNames) {
  let s = src.replace(/^export /gm, '');
  s = s.replace(/import \{([^}]+)\} from '\.\/[^']+';?\n?/g, '');
  const exp = exportNames.map((n) => `  ${n}`).join(',\n');
  return `${s}\nmodule.exports = {\n${exp}\n};\n`;
}

const tokenize = await fs.readFile(path.join(lib, 'tokenize.js'), 'utf8');
const layout = await fs.readFile(path.join(lib, 'layout.js'), 'utf8');
const profiles = await fs.readFile(path.join(lib, 'profiles.js'), 'utf8');
const ollama = await fs.readFile(path.join(lib, 'ollama.js'), 'utf8');
const engineRaw = await fs.readFile(path.join(lib, 'engine.js'), 'utf8');
const profilesJson = await fs.readFile(path.join(lib, 'profiles.json'), 'utf8');

const tokenizeCjs = toCjs(tokenize, ['tokenizeQuery', 'parseSearchQuery']);
const ollamaCjs = toCjs(ollama, [
  'DEFAULT_OLLAMA_URL',
  'DEFAULT_OLLAMA_MODEL',
  'parseJsonLoose',
  'ollamaAvailable',
  'ollamaGenerate',
  'ollamaJson',
]);
const layoutCjs = toCjs(layout, [
  'EN2RU',
  'RU2EN',
  'swapKeyboardEnToRu',
  'swapKeyboardRuToEn',
  'latinToCyrillicRough',
  'cyrillicToLatinRough',
  'expandTokenVariants',
  'expandQueryVariants',
]);
const profilesCjs = toCjs(profiles, ['PROFILE_SETTINGS', 'getProfileConfig', 'PROFILE_IDS']);

const engineCjs =
  tokenizeCjs.replace(/module\.exports[\s\S]*$/, '') +
  layoutCjs.replace(/module\.exports[\s\S]*$/, '') +
  profilesCjs.replace(/module\.exports[\s\S]*$/, '') +
  engineRaw
    .replace(/import \{[^}]+\} from '\.\/tokenize\.js';?\n?/g, '')
    .replace(/import \{[^}]+\} from '\.\/layout\.js';?\n?/g, '')
    .replace(/import \{[^}]+\} from '\.\/profiles\.js';?\n?/g, '')
    .replace(/^export \{[^}]+\} from '\.\/[^']+';?\n?/gm, '')
    .replace(/^export \{[^}]+\};?\s*$/gm, '')
    .replace(/^export /gm, '') +
  '\nmodule.exports = {\n  tokenizeQuery,\n  parseSearchQuery,\n  expandTokenVariants,\n  expandQueryVariants,\n  getProfileConfig,\n  PROFILE_SETTINGS,\n  PROFILE_IDS,\n  matchesSearchFilters,\n  scoreSearchItem,\n  snippetForItem,\n  rankSearchItems,\n  buildIndex,\n  createSearchEngine\n};\n';

const stampedAt = new Date().toISOString();
const versionStamp = {
  name: pkg.name,
  version: pkg.version,
  stampedAt,
  files: ['engine.js', 'engine.cjs', 'ollama.js', 'ollama.cjs', 'profiles.json'],
};

const distDir = path.join(root, 'dist');
await fs.mkdir(distDir, { recursive: true });
await fs.writeFile(path.join(distDir, 'glyph-search-cjs.js'), engineCjs, 'utf8');
await fs.writeFile(path.join(distDir, 'VERSION.json'), JSON.stringify(versionStamp, null, 2) + '\n', 'utf8');

const targets = [
  path.resolve(root, '../glyph-sO/vendor'),
  path.resolve(root, '../glyph-miO/vendor'),
];

for (const dir of targets) {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'ollama.cjs'), ollamaCjs, 'utf8');
  await fs.writeFile(path.join(dir, 'ollama.js'), ollamaCjs, 'utf8');
  await fs.writeFile(path.join(dir, 'engine.cjs'), engineCjs, 'utf8');
  await fs.writeFile(path.join(dir, 'engine.js'), engineCjs, 'utf8');
  await fs.writeFile(path.join(dir, 'profiles.json'), profilesJson, 'utf8');
  await fs.writeFile(path.join(dir, 'VERSION.json'), JSON.stringify(versionStamp, null, 2) + '\n', 'utf8');
  console.log('Wrote vendor →', dir, `(glyph-s ${pkg.version})`);
}

console.log('Wrote dist/glyph-search-cjs.js + dist/VERSION.json');
