import { describe, expect, it } from 'vitest';
import { parseSearchQuery, tokenizeQuery } from '../lib/tokenize.js';

describe('parseSearchQuery', () => {
  it('parses path and tag filters', () => {
    const q = parseSearchQuery('path:projects tag:daily');
    expect(q.path).toBe('projects');
    expect(q.tag).toBe('daily');
    expect(q.tokens).toEqual([]);
  });

  it('parses quoted phrases', () => {
    const q = parseSearchQuery('"deep work" notes');
    expect(q.phrases).toEqual(['deep work']);
    expect(q.required).toContain('deep work');
    expect(q.tokens).toContain('notes');
  });

  it('parses exclusions', () => {
    const q = parseSearchQuery('alpha -draft -scratch');
    expect(q.excluded).toEqual(['draft', 'scratch']);
    expect(q.tokens).toContain('alpha');
  });

  it('parses OR groups', () => {
    const q = parseSearchQuery('(idea OR draft) ship');
    expect(q.orGroups).toEqual([['idea', 'draft']]);
    expect(q.tokens).toContain('ship');
  });

  it('returns empty structure for empty query', () => {
    const q = parseSearchQuery('');
    expect(q.tokens).toEqual([]);
    expect(q.required).toEqual([]);
    expect(q.excluded).toEqual([]);
    expect(q.phrases).toEqual([]);
    expect(q.orGroups).toEqual([]);
    expect(q.path).toBeNull();
    expect(q.tag).toBeNull();
  });

  it('strips # from tag filter', () => {
    const q = parseSearchQuery('tag:#evergreen');
    expect(q.tag).toBe('evergreen');
  });
});

describe('tokenizeQuery', () => {
  it('splits on whitespace and punctuation', () => {
    expect(tokenizeQuery('alpha/beta-gamma')).toEqual(['alpha', 'beta', 'gamma']);
  });
});
