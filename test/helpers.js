/**
 * Fixed corpus helpers for ranking snapshot tests.
 * @param {string} id
 * @param {object} fields
 */
export function item(id, fields) {
  return {
    hash: `#${id}`,
    cat: fields.cat || 'note',
    sub: fields.sub || '',
    keys: fields.keys || [],
    title: () => fields.title,
    body: () => fields.body || '',
  };
}

/** Stable corpus — order of ids in results is what we snapshot. */
export const CORPUS = [
  item('alpha-note', {
    title: 'Alpha Project Notes',
    sub: 'projects/alpha/readme.md',
    keys: ['alpha', 'project'],
    body: 'Deep work notes for the alpha project roadmap and milestones.',
    cat: 'note',
  }),
  item('beta-page', {
    title: 'Beta Handbook',
    sub: 'docs/beta',
    keys: ['beta', 'handbook'],
    body: 'Handbook page covering beta release checklist.',
    cat: 'page',
  }),
  item('alpha-app', {
    title: 'Alpha App',
    sub: 'apps',
    keys: ['alpha'],
    body: 'Desktop app shell for alpha.',
    cat: 'app',
  }),
  item('draft-note', {
    title: 'Draft Scratch',
    sub: 'inbox/draft.md',
    keys: ['draft', 'scratch'],
    body: 'Temporary draft ideas unrelated to shipping.',
    cat: 'note',
  }),
  item('privet-note', {
    title: 'Привет мир',
    sub: 'ru/hello.md',
    keys: ['привет'],
    body: 'Текст на русском: привет и мир.',
    cat: 'note',
  }),
  item('evergreen', {
    title: 'Evergreen Ideas',
    sub: 'notes/evergreen.md',
    keys: ['evergreen', 'ideas'],
    body: 'Long-lived evergreen notes tagged #evergreen for deep work.',
    cat: 'note',
  }),
  item('release-notes', {
    title: '2.7 Release',
    sub: 'releases/2.7',
    keys: ['release', '2.7'],
    body: 'Release notes for glyph-s 2.7 profiles and ranking.',
    cat: 'release',
  }),
  item('noise', {
    title: 'Unrelated Cooking',
    sub: 'recipes/soup.md',
    keys: ['soup'],
    body: 'How to make tomato soup with basil.',
    cat: 'note',
  }),
];

export function rankedIds(hits) {
  return hits.map((h) => (h.it.hash || '').replace(/^#/, ''));
}
