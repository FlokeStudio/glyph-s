import { describe, expect, it } from 'vitest';
import {
  buildIndex,
  createSearchEngine,
  snippetForItem,
  rankSearchItems,
} from '../lib/engine.js';
import { embedTexts, embeddingBoost } from '../lib/embeddings.js';
import { CORPUS, item, rankedIds } from './helpers.js';

describe('buildIndex', () => {
  it('precomputes text bags for all items', () => {
    const index = buildIndex(CORPUS, { profile: 'balanced' });
    expect(index.items).toHaveLength(CORPUS.length);
    expect(index.items[0].bag).toContain('alpha');
    expect(index.profile).toBe('balanced');
    expect(index.createdAt).toBeGreaterThan(0);
  });
});

describe('createSearchEngine', () => {
  it('searches via bound engine instance', () => {
    const engine = createSearchEngine({ items: CORPUS, profile: 'legacy', limit: 5 });
    const hits = engine.search('alpha');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].it.hash).toBe('#alpha-note');
  });

  it('reuses prebuilt index', () => {
    const index = buildIndex(CORPUS, { profile: 'balanced' });
    const engine = createSearchEngine({ index, limit: 3 });
    const hits = engine.search('evergreen');
    expect(rankedIds(hits)).toContain('evergreen');
  });
});

describe('snippetForItem', () => {
  it('returns marked snippet for body match', () => {
    const note = CORPUS.find((x) => x.hash === '#alpha-note');
    const snip = snippetForItem(note, ['alpha'], (s) => s, { profile: 'legacy' });
    expect(snip).toContain('<mark>');
    expect(snip.toLowerCase()).toContain('alpha');
  });

  it('returns empty string when tokens are empty', () => {
    expect(snippetForItem(CORPUS[0], [], (s) => s)).toBe('');
  });

  it('returns empty when body is missing', () => {
    const bare = item('bare', { title: 'Bare', body: '' });
    expect(snippetForItem(bare, ['bare'], (s) => s)).toBe('');
  });
});

describe('empty query ranking', () => {
  it('ranks by category priority when query is empty', () => {
    const hits = rankSearchItems(CORPUS, '', { profile: 'legacy', limit: 3 });
    expect(rankedIds(hits)[0]).toBe('beta-page');
    expect(hits.every((h) => h.score > 0)).toBe(true);
  });
});

describe('embeddings stub', () => {
  it('returns null from embedTexts', async () => {
    expect(await embedTexts(['hello'], {})).toBeNull();
  });

  it('returns zero boost', () => {
    expect(embeddingBoost()).toBe(0);
  });
});
