import { describe, expect, it } from 'vitest';
import {
  rankSearchItems,
  scoreSearchItem,
  parseSearchQuery,
  expandTokenVariants,
  getProfileConfig,
  PROFILE_SETTINGS,
} from '../lib/index.js';
import { CORPUS, rankedIds, item } from './helpers.js';

describe('profiles', () => {
  it('exposes legacy / balanced / max-quality', () => {
    expect(Object.keys(PROFILE_SETTINGS).sort()).toEqual(['balanced', 'legacy', 'max-quality'].sort());
    expect(getProfileConfig('balanced').maxCandidates).toBe(4000);
    expect(getProfileConfig('unknown').fuzzyCutoff).toBe(PROFILE_SETTINGS.legacy.fuzzyCutoff);
  });
});

describe('rankSearchItems order snapshots', () => {
  it('ranks exact title/token hits above noise for "alpha"', () => {
    const hits = rankSearchItems(CORPUS, 'alpha', { profile: 'legacy', limit: 10 });
    expect(rankedIds(hits)).toMatchInlineSnapshot(`
      [
        "alpha-note",
        "alpha-app",
      ]
    `);
  });

  it('ranks multi-token query with stable order for "alpha project"', () => {
    const hits = rankSearchItems(CORPUS, 'alpha project', { profile: 'balanced', limit: 10 });
    expect(rankedIds(hits)).toMatchInlineSnapshot(`
      [
        "alpha-note",
      ]
    `);
  });

  it('respects exclusion filter -draft', () => {
    const hits = rankSearchItems(CORPUS, 'draft -scratch', { profile: 'legacy', limit: 10 });
    expect(rankedIds(hits)).toEqual([]);
  });

  it('filters with tag:evergreen', () => {
    const hits = rankSearchItems(CORPUS, 'tag:evergreen', { profile: 'legacy', limit: 10 });
    expect(rankedIds(hits)).toMatchInlineSnapshot(`
      [
        "evergreen",
      ]
    `);
  });

  it('max-quality keeps alpha-note first for "alpha"', () => {
    const hits = rankSearchItems(CORPUS, 'alpha', { profile: 'max-quality', limit: 5 });
    expect(rankedIds(hits)[0]).toBe('alpha-note');
    expect(rankedIds(hits)).toContain('alpha-app');
  });

  it('empty query prefers higher category priority (page first)', () => {
    const hits = rankSearchItems(CORPUS, '', { profile: 'legacy', limit: 3 });
    expect(rankedIds(hits)[0]).toBe('beta-page');
    expect(hits.every((h) => h.score > 0)).toBe(true);
    expect(hits[0].score).toBeGreaterThanOrEqual(hits[1].score);
  });

  it('finds matches beyond maxCandidates index (not prefix truncation)', () => {
    const filler = Array.from({ length: 5000 }, (_, i) =>
      item(`filler-${i}`, {
        title: `Filler ${i}`,
        keys: ['filler'],
        body: 'noise padding document',
        cat: 'note',
      })
    );
    const buried = item('buried-needle', {
      title: 'Unique Needle Document',
      keys: ['needleunique'],
      body: 'Contains the rare token needleunique for ranking.',
      cat: 'note',
    });
    const corpus = [...filler, buried];
    expect(corpus.length).toBeGreaterThan(getProfileConfig('balanced').maxCandidates);

    const hits = rankSearchItems(corpus, 'needleunique', { profile: 'balanced', limit: 5 });
    expect(rankedIds(hits)).toContain('buried-needle');
    expect(rankedIds(hits)[0]).toBe('buried-needle');
  });
});

describe('scoreSearchItem', () => {
  it('scores empty query by category priority', () => {
    const page = item('p', { title: 'P', cat: 'page' });
    const news = item('n', { title: 'N', cat: 'news' });
    const filters = parseSearchQuery('');
    const pageScore = scoreSearchItem(page, [], filters, { profile: 'legacy' });
    const newsScore = scoreSearchItem(news, [], filters, { profile: 'legacy' });
    expect(pageScore).toBeGreaterThan(newsScore);
  });

  it('gives title exact match a high score', () => {
    const it = item('t', { title: 'alpha', body: 'other' });
    const filters = parseSearchQuery('alpha');
    const score = scoreSearchItem(it, ['alpha'], filters, { profile: 'legacy' });
    expect(score).toBeGreaterThanOrEqual(125);
  });

  it('scores body phrase hits for deep work', () => {
    const note = CORPUS.find((x) => x.hash === '#alpha-note');
    const filters = parseSearchQuery('deep work');
    const score = scoreSearchItem(note, ['deep', 'work'], filters, { profile: 'legacy' });
    expect(score).toBeGreaterThan(0);
  });

  it('ranks body-only terms through fast-path (full-text)', () => {
    const buried = item('buried-body', {
      title: 'Unrelated title',
      sub: 'meta/path',
      keys: ['unrelated', 'meta/path'],
      body: 'Only this paragraph mentions phosphor crystals.',
    });
    const decoy = item('decoy-title', {
      title: 'Phosphor in title',
      body: 'Nothing buried here.',
    });
    const ranked = rankSearchItems([decoy, buried], 'phosphor crystals', { limit: 5, profile: 'legacy' });
    const hashes = ranked.map((r) => r.it.hash);
    expect(hashes).toContain('#buried-body');
  });

  it('rejects prefix false positives for required tokens (alpha vs alphabet)', () => {
    const shortOnly = item('alpha-only', {
      title: 'Short match',
      keys: ['alpha'],
      body: 'Mentions alpha but not the longer form.',
      cat: 'note',
    });
    const full = item('alphabet-full', {
      title: 'Full match',
      keys: ['alphabet'],
      body: 'Contains alphabet explicitly.',
      cat: 'note',
    });
    const filters = parseSearchQuery('alphabet');
    expect(filters.required).toContain('alphabet');

    expect(scoreSearchItem(shortOnly, filters.tokens, filters, { profile: 'legacy' })).toBe(0);
    expect(scoreSearchItem(full, filters.tokens, filters, { profile: 'legacy' })).toBeGreaterThan(0);

    const ranked = rankSearchItems([shortOnly, full], 'alphabet', { limit: 5, profile: 'legacy' });
    expect(rankedIds(ranked)).toEqual(['alphabet-full']);
    expect(rankedIds(ranked)).not.toContain('alpha-only');
  });
});

describe('fuzzy layout', () => {
  it('expands EN keyboard mistype toward RU', () => {
    const variants = expandTokenVariants('ghbdtn', { fuzzyLayout: true, fuzzyTransliteration: false });
    expect(variants).toContain('привет');
  });

  it('scoreSearchItem matches Cyrillic title via layout variant', () => {
    const note = CORPUS.find((x) => x.hash === '#privet-note');
    const filters = parseSearchQuery('ghbdtn');
    const withFuzzy = scoreSearchItem(note, ['ghbdtn'], filters, {
      profile: 'legacy',
      fuzzyLayout: true,
      fuzzyTransliteration: false,
    });
    const without = scoreSearchItem(note, ['ghbdtn'], filters, {
      profile: 'legacy',
      fuzzyLayout: false,
      fuzzyTransliteration: false,
    });
    expect(withFuzzy).toBeGreaterThan(0);
    expect(without).toBe(0);
  });

  it('ranks when layout variant appears in keys (fast-path bag)', () => {
    const corpus = [
      item('ru-keyed', {
        title: 'Привет мир',
        keys: ['ghbdtn', 'привет'],
        body: 'Текст',
        cat: 'note',
      }),
      item('noise', { title: 'Soup', keys: ['soup'], body: 'tomato', cat: 'note' }),
    ];
    const hits = rankSearchItems(corpus, 'ghbdtn', {
      profile: 'legacy',
      limit: 5,
      settings: { fuzzyLayout: true, fuzzyTransliteration: false },
    });
    expect(rankedIds(hits)).toMatchInlineSnapshot(`
      [
        "ru-keyed",
      ]
    `);
  });
});
