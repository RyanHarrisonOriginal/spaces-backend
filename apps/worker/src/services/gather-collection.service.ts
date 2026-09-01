import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

import {
  CollectionNotFoundError,
  ContentRelevanceEvaluationService,
  ContentSearchService,
  BraveSearchAdapter,
  OpenAiAdapter,
  genericContentThumbnail,
  normalizeBraveContentTypes,
  relevanceFilterConfigFromEnv,
  selectAcceptedCandidates,
  type BraveContentType,
  type ContentRelevanceEvaluator,
  type ContentSearchProvider,
  type ContentSearchResult,
  type ContentSearchSummary,
  type EvaluateRelevanceResult,
  type RelevanceFilterConfig,
} from '../../../../packages/discovery/src';
import {
  ContentItem,
  ContentItemSaveStrategy,
  PrismaContentItemRepository,
  PrismaGatherQueryRepository,
  type ContentItemRepository,
} from '../../../../packages/persistence/src';
import { logger } from '../logger';
import { runGenerateCollectionDiscoveryProfile } from './collection-discovery-profile.service';

export type GatherCollectionRecord = {
  id: string;
  name: string;
  description: string;
  braveContentTypes: BraveContentType[];
  space: {
    name: string;
    description: string;
  };
};

export type GatherCollectionStats = {
  collectionId: string;
  queryCount: number;
  rawResultCount: number;
  deduplicatedResultCount: number;
  evaluatedCount: number;
  acceptedCount: number;
  rejectedCount: number;
  failedEvaluationBatchCount: number;
  persistedCount: number;
  duplicateSkippedCount: number;
};

export type GatherCollectionLogger = {
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
};

export type GatherCollectionDependencies = {
  loadCollection(
    collectionId: string,
  ): Promise<GatherCollectionRecord | null>;
  loadQueries(collectionId: string): Promise<string[]>;
  generateProfile(
    collectionId: string,
  ): Promise<{ profile: { searchQueries: string[] } }>;
  searchProvider: (
    contentTypes: BraveContentType[],
  ) => ContentSearchProvider;
  relevanceEvaluator: ContentRelevanceEvaluator;
  contentRepo: ContentItemRepository;
  markCollectionUpdated(collectionId: string): Promise<void>;
  config: RelevanceFilterConfig;
  logger: GatherCollectionLogger;
};

export class GatherCollectionService {
  constructor(private readonly deps: GatherCollectionDependencies) {}

  async execute(collectionId: string): Promise<GatherCollectionStats> {
    this.deps.logger.info('collection gather started', { collectionId });

    const collection = await this.deps.loadCollection(collectionId);
    if (!collection) {
      throw new CollectionNotFoundError(collectionId);
    }

    const queries = await this.resolveQueries(collection.id);
    this.deps.logger.info('collection gather queries selected', {
      collectionId,
      queryCount: queries.length,
      braveContentTypes: collection.braveContentTypes,
    });

    const searchService = new ContentSearchService(
      this.deps.searchProvider(collection.braveContentTypes),
      this.deps.logger,
    );
    const searched =
      queries.length === 0
        ? emptySearchSummary()
        : await searchService.searchQueriesWithStats(queries, {
            collectionId,
          });
    const evaluations =
      searched.results.length === 0
        ? emptyEvaluationResult()
        : await this.deps.relevanceEvaluator.evaluate({
            space: collection.space,
            collection: {
              name: collection.name,
              description: collection.description,
            },
            candidates: searched.results,
          });
    const accepted = selectAcceptedCandidates(
      searched.results,
      evaluations.evaluations,
      this.deps.config.minConfidence,
    );

    const items = accepted.map((result, index) =>
      toContentItem(collection.id, result, index),
    );

    const saved = await this.deps.contentRepo.save(
      {
        collectionId: collection.id,
        items,
      },
      ContentItemSaveStrategy.Replace,
    );

    await this.deps.markCollectionUpdated(collection.id);

    const stats: GatherCollectionStats = {
      collectionId,
      queryCount: queries.length,
      rawResultCount: searched.rawResultCount,
      deduplicatedResultCount: searched.deduplicatedResultCount,
      evaluatedCount: evaluations.evaluatedCount,
      acceptedCount: accepted.length,
      rejectedCount: searched.results.length - accepted.length,
      failedEvaluationBatchCount: evaluations.failedEvaluationBatchCount,
      persistedCount: saved.length,
      duplicateSkippedCount: searched.duplicateSkippedCount,
    };

    this.deps.logger.info('collection gather completed', stats);
    return stats;
  }

  private async resolveQueries(collectionId: string): Promise<string[]> {
    const existing = uniqueQueries(await this.deps.loadQueries(collectionId));
    if (existing.length > 0) {
      this.deps.logger.info('collection gather using existing queries', {
        collectionId,
        queryCount: existing.length,
      });
      return existing;
    }

    this.deps.logger.info('collection gather generating queries', {
      collectionId,
    });
    const persisted = await this.deps.generateProfile(collectionId);
    return uniqueQueries(persisted.profile.searchQueries);
  }
}

export async function runGatherCollection(
  db: PrismaClient,
  collectionId: string,
): Promise<GatherCollectionStats> {
  const config = relevanceFilterConfigFromEnv();
  const gatherQueryRepo = new PrismaGatherQueryRepository(db);
  const service = new GatherCollectionService({
    async loadCollection(id) {
      const row = await db.collection.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          braveContentTypes: true,
          space: { select: { name: true, description: true } },
        },
      });
      if (!row) {
        return null;
      }
      return {
        ...row,
        braveContentTypes: normalizeBraveContentTypes(row.braveContentTypes),
      };
    },
    async loadQueries(id) {
      const rows = await gatherQueryRepo.get({ collectionId: id });
      return rows.map((row) => row.query);
    },
    generateProfile: (id) => runGenerateCollectionDiscoveryProfile(db, id),
    searchProvider: (contentTypes) =>
      BraveSearchAdapter.fromEnv({ contentTypes }),
    relevanceEvaluator: new ContentRelevanceEvaluationService(
      OpenAiAdapter.fromEnv(),
      config,
      logger,
    ),
    contentRepo: new PrismaContentItemRepository(db),
    async markCollectionUpdated(id) {
      await db.collection.update({
        where: { id },
        data: { updatedAt: new Date() },
      });
    },
    config,
    logger,
  });

  return service.execute(collectionId);
}

function emptyEvaluationResult(): EvaluateRelevanceResult {
  return {
    evaluations: new Map(),
    evaluatedCount: 0,
    failedEvaluationBatchCount: 0,
  };
}

function emptySearchSummary(): ContentSearchSummary {
  return {
    results: [],
    rawResultCount: 0,
    deduplicatedResultCount: 0,
    duplicateSkippedCount: 0,
  };
}

function toContentItem(
  collectionId: string,
  result: ContentSearchResult,
  sortOrder: number,
): ContentItem {
  const publishedAt = result.publishedAt
    ? new Date(result.publishedAt)
    : null;
  const type = result.contentType ?? 'article';

  return ContentItem.create({
    id: randomUUID(),
    collectionId,
    provider: result.provider,
    externalId: result.externalId,
    type,
    title: result.title,
    description: result.description,
    url: result.url,
    thumbnailUrl:
      result.thumbnailUrl?.trim() || genericContentThumbnail(type),
    authorName: result.authorName,
    publishedAt:
      publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    discoveredByQueries: result.discoveredByQueries,
    sortOrder,
  });
}

function uniqueQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const query of queries) {
    const trimmed = query.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}
