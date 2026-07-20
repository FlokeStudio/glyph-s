import { performance } from 'node:perf_hooks';
import { createSearchEngine } from '../lib/engine.js';

function syntheticItems(count) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      hash: `#item-${i}`,
      cat: i % 3 === 0 ? 'page' : 'note',
      sub: `folder/item-${i}.md`,
      keys: [`tag${i % 10}`, `key${i}`],
      title: () => `Item ${i} title`,
      body: () => `Body text for item ${i} with searchable content alpha beta gamma.`,
    });
  }
  return items;
}

function bench(count) {
  const items = syntheticItems(count);
  const engine = createSearchEngine({ items, profile: 'balanced', limit: 12 });
  const start = performance.now();
  engine.search('item alpha beta');
  return performance.now() - start;
}

for (const n of [1000, 5000, 10000]) {
  console.log(`${n}: ${bench(n).toFixed(2)} ms`);
}
