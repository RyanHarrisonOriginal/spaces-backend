import {
  CollectionDiscoveryProfileRepository,
  ContentSearchError,
  type ContentSearchProvider,
  type ContentSearchResult,
} from '../../../../../packages/discovery/src';
import { GatherQueryRepository } from '../../../../../packages/persistence/src';
import {
  NotFoundException,
  ValidationException,
} from '../../../../shared/domain/exceptions';
import { logger as defaultLogger, type Logger } from '../../../../shared/logger';

export class GatherCollectionService {
  constructor(
    private readonly gatherQueryRepo: GatherQueryRepository,
    private readonly profileRepo: CollectionDiscoveryProfileRepository,
    private readonly searchProvider: ContentSearchProvider,
    private readonly logger: Logger = defaultLogger,
  ) {}

  async gather(collectionId: string): Promise<ContentSearchResult[]> {
    this.logger.info('collection gather started', { collectionId });

    const queries = await this.loadSearchQueries(collectionId);
    this.logger.info('collection gather queries loaded', {
      collectionId,
      queryCount: queries.length,
    });

    const combined: ContentSearchResult[] = [];
    let succeeded = 0;
    let failed = 0;

    for (const query of queries) {
      try {
        const results = await this.searchProvider.search(query);
        succeeded += 1;
        combined.push(...results);
        this.logger.info('youtube query executed', {
          collectionId,
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
          collectionId,
          query,
          error: error instanceof Error ? error.message : 'YouTube search failed',
        });
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

    const deduplicated = dedupeSearchResults(combined);
    this.logger.info('collection gather completed', {
      collectionId,
      queryCount: queries.length,
      failedQueryCount: failed,
      resultCount: combined.length,
      deduplicatedResultCount: deduplicated.length,
    });

    return deduplicated;
  }

  private async loadSearchQueries(collectionId: string): Promise<string[]> {
    const stored = await this.gatherQueryRepo.get({ collectionId });
    const fromStored = uniqueQueries(stored.map((row) => row.query));
    if (fromStored.length > 0) {
      return fromStored;
    }

    const profile = await this.profileRepo.get(collectionId);
    if (!profile) {
      throw new NotFoundException('Discovery profile', collectionId);
    }

    const fromProfile = uniqueQueries(profile.profile.searchQueries);
    if (fromProfile.length === 0) {
      throw new ValidationException(
        'No generated search queries for this collection',
      );
    }

    return fromProfile;
  }
}

function uniqueQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const query of queries) {
    const trimmed = query.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

function dedupeSearchResults(
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
