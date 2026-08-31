import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

import {
  CollectionNotFoundError,
  ContentRelevanceEvaluationService,
  ContentSearchService,
  OpenAiAdapter,
  YoutubeSearchAdapter,
  relevanceFilterConfigFromEnv,
  selectAcceptedCandidates,
  type ContentRelevanceEvaluator,
  type ContentSearchResult,
  type EvaluateRelevanceResult,
  type RelevanceFilterConfig,
} from '../../../../packages/discovery/src';
import {
  ContentItem,
  ContentItemSaveStrategy,
  PrismaContentItemRepository,
  type ContentItemRepository,
} from '../../../../packages/persistence/src';
import { logger } from '../logger';
import { runGenerateCollectionDiscoveryProfile } from './collection-discovery-profile.service';

export type GatherCollectionRecord = {
  id: string;
  name: string;
  description: string;
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
  generateProfile(
    collectionId: string,
  ): Promise<{ profile: { searchQueries: string[] } }>;
  searchService: Pick<ContentSearchService, 'searchQueriesWithStats'>;
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

    const persisted = await this.deps.generateProfile(collection.id);
    const queries = uniqueQueries(persisted.profile.searchQueries);
    this.deps.logger.info('collection gather queries loaded', {
      collectionId,
      queryCount: queries.length,
    });

    const searched = await this.deps.searchService.searchQueriesWithStats(
      queries,
      { collectionId },
    );

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
}

export async function runGatherCollection(
  db: PrismaClient,
  collectionId: string,
): Promise<GatherCollectionStats> {
  const config = relevanceFilterConfigFromEnv();
  const service = new GatherCollectionService({
    async loadCollection(id) {
      const row = await db.collection.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          space: { select: { name: true, description: true } },
        },
      });
      return row;
    },
    generateProfile: (id) => runGenerateCollectionDiscoveryProfile(db, id),
    searchService: new ContentSearchService(
      YoutubeSearchAdapter.fromEnv(),
      logger,
    ),
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

function toContentItem(
  collectionId: string,
  result: ContentSearchResult,
  sortOrder: number,
): ContentItem {
  const publishedAt = result.publishedAt
    ? new Date(result.publishedAt)
    : null;

  return ContentItem.create({
    id: randomUUID(),
    collectionId,
    provider: result.provider,
    externalId: result.externalId,
    type: 'video',
    title: result.title,
    description: result.description,
    url: result.url,
    thumbnailUrl: result.thumbnailUrl,
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
