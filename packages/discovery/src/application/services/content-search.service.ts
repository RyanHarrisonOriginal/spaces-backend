import { ContentSearchError } from '../errors/content-search.error';
import type {
  ContentSearchProvider,
  ContentSearchResult,
} from '../ports/content-search-provider.port';

export type ContentSearchLogger = {
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
};

const silentLogger: ContentSearchLogger = {
  info() {},
  warn() {},
  error() {},
};

export type ContentSearchSummary = {
  results: ContentSearchResult[];
  rawResultCount: number;
  deduplicatedResultCount: number;
  duplicateSkippedCount: number;
};

export class ContentSearchService {
  constructor(
    private readonly searchProvider: ContentSearchProvider,
    private readonly logger: ContentSearchLogger = silentLogger,
  ) {}

  async searchQueries(
    queries: string[],
    fields: Record<string, unknown> = {},
  ): Promise<ContentSearchResult[]> {
    return (await this.searchQueriesWithStats(queries, fields)).results;
  }

  async searchQueriesWithStats(
    queries: string[],
    fields: Record<string, unknown> = {},
  ): Promise<ContentSearchSummary> {
    const combined: ContentSearchResult[] = [];
    let succeeded = 0;
    let failed = 0;

    for (const query of queries) {
      try {
        this.logger.info('youtube query executing', { ...fields, query });
        const results = await this.searchProvider.search(query);
        succeeded += 1;
        combined.push(...results);
        this.logger.info('youtube query executed', {
          ...fields,
          query,
          resultCount: results.length,
        });
      } catch (error) {
        if (
          error instanceof ContentSearchError &&
          error.kind === 'configuration'
        ) {
          throw error;
        }
        failed += 1;
        this.logger.warn('youtube query failed', {
          ...fields,
          query,
          error:
            error instanceof Error ? error.message : 'YouTube search failed',
          ...(error instanceof ContentSearchError ? error.details : {}),
        });
        if (
          error instanceof ContentSearchError &&
          error.kind === 'rate_limit'
        ) {
          throw error;
        }
      }
    }

    if (succeeded === 0) {
      throw new ContentSearchError(
        failed > 0
          ? 'YouTube search failed for all queries'
          : 'YouTube search failed',
        'provider',
      );
    }

    const results = dedupeSearchResults(combined);
    return {
      results,
      rawResultCount: combined.length,
      deduplicatedResultCount: results.length,
      duplicateSkippedCount: combined.length - results.length,
    };
  }
}

export function dedupeSearchResults(
  results: ContentSearchResult[],
): ContentSearchResult[] {
  const byKey = new Map<string, ContentSearchResult>();
  for (const result of results) {
    const key = `${result.provider}:${result.externalId}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, result);
      continue;
    }

    const queries = new Set(existing.discoveredByQueries);
    for (const query of result.discoveredByQueries) {
      queries.add(query);
    }
    byKey.set(key, {
      ...existing,
      discoveredByQueries: [...queries],
    });
  }
  return [...byKey.values()];
}
