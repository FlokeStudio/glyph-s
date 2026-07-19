/**
 * Public API typedefs for glyph-s (JSDoc / checkJs).
 * Import types via `import('glyph-s/lib/types.js').SearchItem` or `@typedef` references.
 * @module types
 */

/**
 * Category used for base priority when the query is empty.
 * @typedef {'page'|'note'|'app'|'release'|'action'|'news'|string} SearchItemCategory
 */

/**
 * A searchable corpus item. `title` / `body` may be lazy getters.
 * @typedef {object} SearchItem
 * @property {() => string} title Primary label
 * @property {string} [sub] Secondary text (path, subtitle)
 * @property {string[]} [keys] Extra index keys
 * @property {(() => string)|string} [body] Full text content
 * @property {SearchItemCategory} [cat] Category for priority boost
 * @property {string} [hash] Route / identity hint (filters, snippet cache)
 */

/**
 * Tuning knobs for one search profile.
 * @typedef {object} SearchProfileConfig
 * @property {number} fuzzyCutoff Minimum bigram overlap for fuzzy token hits
 * @property {number} scoreScale Multiplier applied to final scores
 * @property {number} maxCandidates Cap on items considered before scoring
 */

/**
 * Per-query / engine fuzzy settings.
 * @typedef {object} SearchSettings
 * @property {boolean} [fuzzyLayout] EN↔RU keyboard swap (default true)
 * @property {boolean} [fuzzyTransliteration] Latin↔Cyrillic rough map (default true)
 * @property {string} [profile] Profile id: legacy | balanced | max-quality
 */

/**
 * Structured filters produced by {@link parseSearchQuery}.
 * @typedef {object} ParsedSearchQuery
 * @property {string|null} type
 * @property {string|null} page
 * @property {string|null} app
 * @property {string|null} path
 * @property {string|null} tag
 * @property {string[]} tokens
 * @property {string[]} required
 * @property {string[]} excluded
 * @property {string[]} phrases
 * @property {string[][]} orGroups
 */

/**
 * Timing / count stats from a ranking pass (e.g. glyph-sO debug panel).
 * @typedef {object} SearchDiagnostics
 * @property {string} profile
 * @property {number} inputCount
 * @property {number} candidateCount
 * @property {number} scoredCount
 * @property {number} outputCount
 * @property {number} elapsedMs
 */

/**
 * Options for {@link rankSearchItems}.
 * @typedef {object} RankSearchOptions
 * @property {number} [limit]
 * @property {string} [profile]
 * @property {SearchSettings} [settings]
 * @property {(d: SearchDiagnostics) => void} [onDiagnostics]
 */

/**
 * One scored hit from ranking.
 * @typedef {object} RankedHit
 * @property {SearchItem} it
 * @property {number} score
 */

/**
 * Precomputed bag index from {@link buildIndex}.
 * @typedef {object} SearchIndex
 * @property {{ id: number, it: SearchItem, bag: string, cat: string }[]} items
 * @property {string} profile
 * @property {number} createdAt
 */

/**
 * Options for {@link buildIndex}.
 * @typedef {object} BuildIndexOptions
 * @property {string} [profile]
 */

/**
 * Options for {@link createSearchEngine}.
 * @typedef {object} CreateSearchEngineOptions
 * @property {string} [profile] Default profile (default `balanced`)
 * @property {number} [limit] Default result limit
 * @property {SearchItem[]} [items] Corpus (used when `index` omitted)
 * @property {SearchIndex} [index] Prebuilt index
 * @property {SearchSettings} [settings]
 * @property {(d: SearchDiagnostics) => void} [onDiagnostics]
 */

/**
 * High-level engine returned by {@link createSearchEngine}.
 * @typedef {object} SearchEngine
 * @property {string} profile
 * @property {SearchIndex} index
 * @property {(query: string, runtime?: RankSearchOptions) => RankedHit[]} search
 */

export {};
