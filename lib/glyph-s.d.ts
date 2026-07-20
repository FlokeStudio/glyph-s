export type SearchProfile = 'legacy' | 'balanced' | 'max-quality';

export interface SearchSettings {
  fuzzyLayout?: boolean;
  fuzzyTransliteration?: boolean;
  profile?: SearchProfile;
  semanticEmbeddings?: boolean;
  embeddingModelPath?: string;
  embedder?: (
    texts: string[],
    opts?: Record<string, unknown>
  ) => Promise<Float32Array[] | null> | Float32Array[] | null;
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
  search(
    query: string,
    runtime?: Record<string, unknown>
  ): RankedSearchResult[] | Promise<RankedSearchResult[]>;
}

export interface IndexRow {
  it: SearchItem;
  bag?: string;
  embedding?: Float32Array;
  embeddingSource?: 'hash' | 'onnx';
}

export interface BuildIndexOptions {
  items?: SearchItem[];
  profile?: SearchProfile;
  cacheEmbeddings?: boolean;
}

export interface RankOptions {
  settings?: SearchSettings;
  profile?: SearchProfile;
  limit?: number;
  index?: { items: IndexRow[] };
  embedder?: (
    texts: string[],
    opts?: Record<string, unknown>
  ) => Promise<Float32Array[] | null> | Float32Array[] | null;
  onDiagnostics?: (stats: Record<string, unknown>) => void;
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
export function rankSearchItemsAsync(
  items: SearchItem[],
  query: string,
  opts?: RankOptions
): Promise<RankedSearchResult[]>;
export function buildIndex(
  items?: SearchItem[],
  opts?: BuildIndexOptions
): { items: IndexRow[]; profile: string; createdAt: number };
export function warmIndexEmbeddings(
  index: { items: IndexRow[] },
  opts?: {
    embeddingModelPath?: string;
    modelPath?: string;
    embedder?: RankOptions['embedder'];
  }
): Promise<{ items: IndexRow[] }>;
export function createSearchEngine(opts?: RankOptions & {
  items?: SearchItem[];
  onDiagnostics?: RankOptions['onDiagnostics'];
}): SearchEngine & {
  index: { items: IndexRow[] };
  warmEmbeddings: (runtime?: Record<string, unknown>) => Promise<{ items: IndexRow[] }>;
};
export function snippetForItem(
  item: SearchItem,
  tokens: string[],
  esc?: (s: string) => string,
  settings?: SearchSettings
): string;

export function embedTexts(
  texts: string[],
  opts?: {
    enabled?: boolean;
    semanticEmbeddings?: boolean;
    modelPath?: string;
    embeddingModelPath?: string;
    embedder?: RankOptions['embedder'];
  }
): Promise<Float32Array[] | null>;

export function embedTextSync(text: string): Float32Array;

export function embeddingBoost(
  queryVector: Float32Array | number[] | null | undefined,
  itemVector?: Float32Array | number[] | null,
  weight?: number
): number;

export function resetEmbeddingSession(): void;

