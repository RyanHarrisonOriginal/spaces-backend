import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import type {
  ContentRelevanceEvaluator,
  ContentSearchProvider,
  ContentSearchResult,
  ContentRelevanceEvaluation,
  EvaluateRelevanceResult,
} from '../../../../packages/discovery/src';
import { ContentSearchService } from '../../../../packages/discovery/src';
import { LlmGenerationError } from '../../../../packages/discovery/src';
import {
  ContentItem,
  ContentItemRepository,
  ContentItemSaveStrategy,
} from '../../../../packages/persistence/src';
import {
  GatherCollectionService,
  type GatherCollectionRecord,
} from './gather-collection.service';

function searchResult(
  externalId: string,
  query: string,
  title = externalId,
): ContentSearchResult {
  return {
    provider: 'youtube',
    externalId,
    title,
    description: `${title} description`,
    url: `https://www.youtube.com/watch?v=${externalId}`,
    discoveredByQueries: [query],
  };
}

function providerFromMap(
  responses: Record<string, ContentSearchResult[] | Error>,
): ContentSearchProvider & { searched: string[] } {
  const searched: string[] = [];
  return {
    searched,
    async search(query: string) {
      searched.push(query);
      const response = responses[query];
      if (response instanceof Error) {
        throw response;
      }
      return response ?? [];
    },
  };
}

class FakeContentItemRepository extends ContentItemRepository {
  saved: ContentItem[] = [];
  saveCalls = 0;

  async get(id: string): Promise<ContentItem | null>;
  async get(query: { collectionId: string }): Promise<ContentItem[]>;
  async get(
    idOrQuery: string | { collectionId: string },
  ): Promise<ContentItem | ContentItem[] | null> {
    if (typeof idOrQuery === 'string') {
      return this.saved.find((item) => item.id === idOrQuery) ?? null;
    }
    return this.saved.filter(
      (item) => item.collectionId === idOrQuery.collectionId,
    );
  }

  async save(
    input: { collectionId: string; items: ContentItem[] },
    _strategy: typeof ContentItemSaveStrategy.Replace,
  ): Promise<ContentItem[]> {
    this.saveCalls += 1;
    this.saved = input.items;
    return input.items;
  }
}

class ScriptedEvaluator implements ContentRelevanceEvaluator {
  calls: Array<{
    candidateIds: string[];
    spaceName: string;
    collectionName: string;
    collectionDescription: string;
  }> = [];

  constructor(
    private readonly script: (
      candidateIds: string[],
    ) => EvaluateRelevanceResult | Error,
  ) {}

  async evaluate(input: {
    space: { name: string; description: string };
    collection: { name: string; description: string };
    candidates: Array<{ externalId: string }>;
  }): Promise<EvaluateRelevanceResult> {
    const candidateIds = input.candidates.map((item) => item.externalId);
    this.calls.push({
      candidateIds,
      spaceName: input.space.name,
      collectionName: input.collection.name,
      collectionDescription: input.collection.description,
    });
    const next = this.script(candidateIds);
    if (next instanceof Error) {
      throw next;
    }
    return next;
  }
}

function evalMap(
  entries: Array<[string, Partial<ContentRelevanceEvaluation>]>,
): Map<string, ContentRelevanceEvaluation> {
  return new Map(
    entries.map(([externalId, value]) => [
      externalId,
      {
        externalId,
        relevant: value.relevant ?? false,
        confidence: value.confidence ?? 0,
        reason: value.reason ?? '',
      },
    ]),
  );
}

const collection: GatherCollectionRecord = {
  id: 'col-1',
  name: 'Jab teep',
  description: 'Using the jab and teep together offensively.',
  space: {
    name: 'Muay Thai',
    description: 'Intermediate southpaw striking.',
  },
};

const silentLogger = {
  info() {},
  warn() {},
  error() {},
};

function createService(options: {
  queries?: string[];
  search: ContentSearchProvider;
  evaluator: ContentRelevanceEvaluator;
  contentRepo: FakeContentItemRepository;
  minConfidence?: number;
}) {
  const generateCalls: string[] = [];
  const service = new GatherCollectionService({
    async loadCollection(id) {
      return id === collection.id ? collection : null;
    },
    async generateProfile(id) {
      generateCalls.push(id);
      return {
        profile: {
          searchQueries: options.queries ?? ['lead teep', 'jab teep'],
        },
      };
    },
    searchService: new ContentSearchService(options.search),
    relevanceEvaluator: options.evaluator,
    contentRepo: options.contentRepo,
    async markCollectionUpdated() {},
    config: {
      minConfidence: options.minConfidence ?? 0.7,
      batchSize: 10,
    },
    logger: silentLogger,
  });
  return { service, generateCalls };
}

describe('GatherCollectionService', () => {
  it('runs YouTube search and LLM relevance only in the worker gather service', () => {
    const source = readFileSync(
      join(__dirname, 'gather-collection.service.ts'),
      'utf8',
    );
    assert.match(source, /YoutubeSearchAdapter/);
    assert.match(source, /ContentRelevanceEvaluationService/);
    assert.match(source, /selectAcceptedCandidates/);
    assert.match(source, /contentRepo\.save/);
  });

  it('loads search queries, searches YouTube, then evaluates relevance', async () => {
    const search = providerFromMap({
      'lead teep': [searchResult('a', 'lead teep')],
      'jab teep': [searchResult('b', 'jab teep')],
    });
    const evaluator = new ScriptedEvaluator((ids) => ({
      evaluations: evalMap(
        ids.map((id) => [id, { relevant: true, confidence: 0.9 }]),
      ),
      evaluatedCount: ids.length,
      failedEvaluationBatchCount: 0,
    }));
    const contentRepo = new FakeContentItemRepository();
    const { service, generateCalls } = createService({
      search,
      evaluator,
      contentRepo,
    });

    const stats = await service.execute(collection.id);

    assert.deepEqual(generateCalls, [collection.id]);
    assert.deepEqual(search.searched, ['lead teep', 'jab teep']);
    assert.equal(evaluator.calls.length, 1);
    assert.ok(
      evaluator.calls[0] !== undefined &&
        search.searched.length > 0,
      'YouTube search runs before relevance evaluation',
    );
    assert.deepEqual(evaluator.calls[0]?.candidateIds, ['a', 'b']);
    assert.equal(evaluator.calls[0]?.collectionName, 'Jab teep');
    assert.equal(
      evaluator.calls[0]?.collectionDescription,
      'Using the jab and teep together offensively.',
    );
    assert.equal(evaluator.calls[0]?.spaceName, 'Muay Thai');
    assert.equal(stats.queryCount, 2);
    assert.equal(stats.persistedCount, 2);
  });

  it('deduplicates videos before relevance evaluation', async () => {
    const search = providerFromMap({
      'lead teep': [searchResult('abc123', 'lead teep', 'Lead Teep Setup')],
      'jab teep': [searchResult('abc123', 'jab teep', 'Lead Teep Setup')],
    });
    const evaluator = new ScriptedEvaluator((ids) => ({
      evaluations: evalMap(
        ids.map((id) => [id, { relevant: true, confidence: 0.95 }]),
      ),
      evaluatedCount: ids.length,
      failedEvaluationBatchCount: 0,
    }));
    const contentRepo = new FakeContentItemRepository();
    const { service } = createService({ search, evaluator, contentRepo });

    const stats = await service.execute(collection.id);

    assert.deepEqual(evaluator.calls[0]?.candidateIds, ['abc123']);
    assert.equal(stats.rawResultCount, 2);
    assert.equal(stats.deduplicatedResultCount, 1);
    assert.equal(stats.duplicateSkippedCount, 1);
    assert.equal(contentRepo.saved.length, 1);
    assert.equal(contentRepo.saved[0]?.externalId, 'abc123');
    assert.deepEqual(contentRepo.saved[0]?.discoveredByQueries, [
      'lead teep',
      'jab teep',
    ]);
  });

  it('persists only proven-relevant high-confidence videos', async () => {
    const search = providerFromMap({
      'lead teep': [
        searchResult('keep', 'lead teep'),
        searchResult('reject', 'lead teep'),
        searchResult('low', 'lead teep'),
        searchResult('missing', 'lead teep'),
      ],
    });
    const evaluator = new ScriptedEvaluator(() => ({
      evaluations: evalMap([
        ['keep', { relevant: true, confidence: 0.9 }],
        ['reject', { relevant: false, confidence: 0.99 }],
        ['low', { relevant: true, confidence: 0.4 }],
      ]),
      evaluatedCount: 3,
      failedEvaluationBatchCount: 0,
    }));
    const contentRepo = new FakeContentItemRepository();
    const { service } = createService({
      queries: ['lead teep'],
      search,
      evaluator,
      contentRepo,
    });

    const stats = await service.execute(collection.id);

    assert.deepEqual(
      contentRepo.saved.map((item) => item.externalId),
      ['keep'],
    );
    assert.equal(stats.acceptedCount, 1);
    assert.equal(stats.rejectedCount, 3);
    assert.equal(stats.persistedCount, 1);
  });

  it('never persists rejected, low-confidence, or missing evaluations', async () => {
    const search = providerFromMap({
      q: [
        searchResult('reject', 'q'),
        searchResult('low', 'q'),
        searchResult('missing', 'q'),
      ],
    });
    const evaluator = new ScriptedEvaluator(() => ({
      evaluations: evalMap([
        ['reject', { relevant: false, confidence: 0.99 }],
        ['low', { relevant: true, confidence: 0.69 }],
      ]),
      evaluatedCount: 2,
      failedEvaluationBatchCount: 0,
    }));
    const contentRepo = new FakeContentItemRepository();
    const { service } = createService({
      queries: ['q'],
      search,
      evaluator,
      contentRepo,
    });

    await service.execute(collection.id);

    assert.deepEqual(contentRepo.saved, []);
  });

  it('does not persist candidates from a failed evaluation batch', async () => {
    const search = providerFromMap({
      q: [searchResult('keep', 'q'), searchResult('failed-batch', 'q')],
    });
    const evaluator: ContentRelevanceEvaluator = {
      async evaluate(input) {
        const evaluations = evalMap([
          ['keep', { relevant: true, confidence: 0.92 }],
        ]);
        for (const candidate of input.candidates) {
          if (candidate.externalId === 'failed-batch') {
            evaluations.delete(candidate.externalId);
          }
        }
        return {
          evaluations,
          evaluatedCount: evaluations.size,
          failedEvaluationBatchCount: 1,
        };
      },
    };
    const contentRepo = new FakeContentItemRepository();
    const { service } = createService({
      queries: ['q'],
      search,
      evaluator,
      contentRepo,
    });

    const stats = await service.execute(collection.id);

    assert.deepEqual(
      contentRepo.saved.map((item) => item.externalId),
      ['keep'],
    );
    assert.equal(stats.failedEvaluationBatchCount, 1);
    assert.equal(stats.rejectedCount, 1);
  });

  it('does not persist when every evaluation batch fails', async () => {
    const search = providerFromMap({
      q: [searchResult('a', 'q')],
    });
    const evaluator = new ScriptedEvaluator(
      () => new LlmGenerationError('Relevance evaluation failed for all batches'),
    );
    const contentRepo = new FakeContentItemRepository();
    const { service } = createService({
      queries: ['q'],
      search,
      evaluator,
      contentRepo,
    });

    await assert.rejects(
      () => service.execute(collection.id),
      LlmGenerationError,
    );
    assert.equal(contentRepo.saveCalls, 0);
  });
});
