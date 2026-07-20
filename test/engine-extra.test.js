import { describe, expect, it } from 'vitest';
import {
  buildIndex,
  createSearchEngine,
  snippetForItem,
  rankSearchItems,
  rankSearchItemsAsync,
  warmIndexEmbeddings,
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

describe('embeddings', () => {
  it('returns null from embedTexts when disabled', async () => {
    expect(await embedTexts(['hello'], {})).toBeNull();
  });

  it('returns hash vectors when enabled without a model', async () => {
    const vectors = await embedTexts(['hello'], { semanticEmbeddings: true });
    expect(vectors).toHaveLength(1);
    expect(vectors[0]).toBeInstanceOf(Float32Array);
    expect(vectors[0].length).toBe(64);
  });

  it('returns zero boost for missing vectors', () => {
    expect(embeddingBoost()).toBe(0);
  });

  it('falls back to hash when onnxruntime-node is unavailable', async () => {
    const vectors = await embedTexts(['fallback'], {
      semanticEmbeddings: true,
      embeddingModelPath: '/nonexistent/model.onnx',
    });
    expect(vectors).toHaveLength(1);
    expect(vectors[0]).toBeInstanceOf(Float32Array);
  });

  it('ONNX/custom embedder ranking differs from hash-only', async () => {
    const corpus = [
      item('hash-friend', {
        title: 'Shared Notes',
        keys: ['notes', 'alpha'],
        body: 'notes alpha cooking pasta recipes and broth',
        cat: 'note',
      }),
      item('onnx-friend', {
        title: 'Shared Notes',
        keys: ['notes', 'alpha'],
        body: 'notes alpha soft kitten feline companions',
        cat: 'note',
      }),
    ];

    const hashHits = await rankSearchItemsAsync(corpus, 'notes alpha', {
      limit: 2,
      profile: 'legacy',
      settings: { semanticEmbeddings: true },
    });

    const mockEmbedder = (texts) =>
      texts.map((text) => {
        const v = new Float32Array(64);
        const low = String(text).toLowerCase();
        // Align the short query with the kitten document; push cooking away.
        if (low.includes('kitten') || low.includes('feline')) v[0] = 1;
        else if (!low.includes('cooking') && !low.includes('pasta')) v[0] = 1;
        else v[1] = 1;
        return v;
      });

    const onnxHits = await rankSearchItemsAsync(corpus, 'notes alpha', {
      limit: 2,
      profile: 'legacy',
      settings: {
        semanticEmbeddings: true,
        embeddingModelPath: '/fake/model.onnx',
      },
      embedder: mockEmbedder,
    });

    expect(hashHits.length).toBeGreaterThan(0);
    expect(onnxHits.length).toBeGreaterThan(0);
    expect(rankedIds(onnxHits)[0]).toBe('onnx-friend');
    // Hash path does not use the kitten-aligned embedder, so order/scores diverge.
    expect(rankedIds(onnxHits)).not.toEqual(rankedIds(hashHits));
    expect(onnxHits[0].score).not.toBe(hashHits.find((h) => h.it.hash === '#onnx-friend')?.score);
  });

  it('buildIndex caches hash embeddings for sync semantic boost', () => {
    const index = buildIndex(
      [item('cached', { title: 'Cached', body: 'vector bag text', keys: ['cached'] })],
      { profile: 'legacy' }
    );
    expect(index.items[0].embedding).toBeInstanceOf(Float32Array);
    expect(index.items[0].embeddingSource).toBe('hash');
  });

  it('warmIndexEmbeddings marks onnx-sourced vectors via custom embedder', async () => {
    const index = buildIndex(
      [item('warm', { title: 'Warm', body: 'kitten', keys: ['warm'] })],
      { profile: 'legacy' }
    );
    await warmIndexEmbeddings(index, {
      embeddingModelPath: '/fake/model.onnx',
      embedder: (texts) => texts.map(() => {
        const v = new Float32Array(64);
        v[0] = 1;
        return v;
      }),
    });
    expect(index.items[0].embeddingSource).toBe('onnx');
    expect(index.items[0].embedding[0]).toBe(1);
  });
});
