export type SearchProfile = 'legacy' | 'balanced' | 'max-quality';

export interface SearchSettings {
  fuzzyLayout?: boolean;
  fuzzyTransliteration?: boolean;
  profile?: SearchProfile;
  semanticEmbeddings?: boolean;
  embeddingModelPath?: string;
}

export interface ParsedSearchQuery {
  tokens: string[];
  required: string[];
  excluded: string[];
  orGroups: string[][];
  filters?: Record<string, string>;
}

export interface SearchItem {
  title: () => string;
  sub?: string;
  keys?: string[];
  body?: string | (() => string);
  cat?: string;
  path?: string;
  tags?: string[];
}

export interface RankedSearchResult {
  it: SearchItem;
  score: number;
}

export interface SearchEngine {
  search(query: string, runtime?: Record<string, unknown>): RankedSearchResult[];
}

export interface IndexRow {
  it: SearchItem;
  bag?: string;
}

export interface BuildIndexOptions {
  items: SearchItem[];
}

export interface RankOptions {
  settings?: SearchSettings;
  profile?: SearchProfile;
  limit?: number;
  index?: { items: IndexRow[] };
}

export function parseSearchQuery(query: string): ParsedSearchQuery;
export function tokenizeQuery(query: string): string[];
export function matchesSearchFilters(item: SearchItem, filters: ParsedSearchQuery): boolean;
export function scoreSearchItem(
  item: SearchItem,
  tokens: string[],
  filters: ParsedSearchQuery,
  settings?: SearchSettings
): number;
export function rankSearchItems(
  items: SearchItem[],
  query: string,
  opts?: RankOptions
): RankedSearchResult[];
export function buildIndex(items: SearchItem[], opts?: BuildIndexOptions): { items: IndexRow[] };
export function createSearchEngine(items: SearchItem[], opts?: RankOptions): SearchEngine;
export function snippetForItem(
  item: SearchItem,
  query: string,
  settings?: SearchSettings
): { text: string; offset?: number } | null;

export function embedTexts(
  texts: string[],
  opts?: { enabled?: boolean; modelPath?: string }
): Promise<Float32Array[] | null>;

export function embeddingBoost(
  queryVector: Float32Array | number[] | null,
  itemVector: Float32Array | number[] | null,
  weight?: number
): number;
