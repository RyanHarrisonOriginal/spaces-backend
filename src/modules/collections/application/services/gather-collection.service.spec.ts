import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';

import {
  CollectionDiscoveryProfileRepository,
  ContentSearchError,
  type ContentSearchProvider,
  type ContentSearchResult,
  type PersistedCollectionDiscoveryProfile,
} from '../../../../../packages/discovery/src';
import {
  GatherQuery,
  GatherQueryRepository,
  GatherQuerySaveStrategy,
} from '../../../../../packages/persistence/src';
import {
  NotFoundException,
  ValidationException,
} from '../../../../shared/domain/exceptions';
import type { Logger } from '../../../../shared/logger';
import { GatherCollectionService } from './gather-collection.service';

const silentLogger: Logger = {
  info() {},
  warn() {},
  error() {},
};

const collectionId = randomUUID();

function result(
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

class InMemoryGatherQueryRepository extends GatherQueryRepository {
  items: GatherQuery[] = [];

  async get(id: string): Promise<GatherQuery | null>;
  async get(query: { collectionId: string }): Promise<GatherQuery[]>;
  async get(
    idOrQuery: string | { collectionId: string },
  ): Promise<GatherQuery | GatherQuery[] | null> {
    if (typeof idOrQuery === 'string') {
      return this.items.find((item) => item.id === idOrQuery) ?? null;
    }
    return this.items.filter(
      (item) => item.collectionId === idOrQuery.collectionId,
    );
  }

  async save(
    entity: GatherQuery,
    strategy?: typeof GatherQuerySaveStrategy.Upsert,
  ): Promise<GatherQuery>;
  async save(
    input: { collectionId: string; items: GatherQuery[] },
    strategy: typeof GatherQuerySaveStrategy.Replace,
  ): Promise<GatherQuery[]>;
  async save(
    entityOrInput: GatherQuery | { collectionId: string; items: GatherQuery[] },
  ): Promise<GatherQuery | GatherQuery[]> {
    if ('items' in entityOrInput) {
      this.items = [...entityOrInput.items];
      return this.items;
    }
    this.items.push(entityOrInput);
    return entityOrInput;
  }
}

class InMemoryProfileRepository extends CollectionDiscoveryProfileRepository {
  record: PersistedCollectionDiscoveryProfile | null = null;

  async get(): Promise<PersistedCollectionDiscoveryProfile | null> {
    return this.record;
  }

  async save(
    record: PersistedCollectionDiscoveryProfile,
  ): Promise<PersistedCollectionDiscoveryProfile> {
    this.record = record;
    return record;
  }
}

function queries(...text: string[]): InMemoryGatherQueryRepository {
  const repo = new InMemoryGatherQueryRepository();
  repo.items = text.map((query) =>
    GatherQuery.create({
      id: randomUUID(),
      collectionId,
      query,
    }),
  );
  return repo;
}

function profileWithQueries(
  searchQueries: string[],
): InMemoryProfileRepository {
  const repo = new InMemoryProfileRepository();
  repo.record = {
    id: randomUUID(),
    collectionId,
    version: 1,
    status: 'active',
    provider: 'test',
    model: 'fake',
    promptVersion: '1',
    createdAt: new Date(),
    supersededAt: null,
    profile: {
      topics: ['teep'],
      searchQueries,
      positiveSignals: ['technique'],
      negativeSignals: ['highlights'],
    },
  };
  return repo;
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

function service(options: {
  gatherQueries?: InMemoryGatherQueryRepository;
  profile?: InMemoryProfileRepository;
  search: ContentSearchProvider;
}): GatherCollectionService {
  return new GatherCollectionService(
    options.gatherQueries ?? new InMemoryGatherQueryRepository(),
    options.profile ?? new InMemoryProfileRepository(),
    options.search,
    silentLogger,
  );
}

describe('GatherCollectionService', () => {
  it('executes each generated search query', async () => {
    const search = providerFromMap({
      'lead teep': [result('a', 'lead teep')],
      'jab teep': [result('b', 'jab teep')],
    });

    const gathered = await service({
      gatherQueries: queries('lead teep', 'jab teep'),
      search,
    }).gather(collectionId);

    assert.deepEqual(search.searched, ['lead teep', 'jab teep']);
    assert.equal(gathered.length, 2);
  });

  it('combines results from every query', async () => {
    const gathered = await service({
      gatherQueries: queries('lead teep', 'jab teep'),
      search: providerFromMap({
        'lead teep': [result('a', 'lead teep')],
        'jab teep': [result('b', 'jab teep')],
      }),
    }).gather(collectionId);

    assert.deepEqual(
      gathered.map((item) => item.externalId),
      ['a', 'b'],
    );
  });

  it('deduplicates repeated videos and merges query lineage', async () => {
    const gathered = await service({
      gatherQueries: queries('lead teep', 'jab teep'),
      search: providerFromMap({
        'lead teep': [result('abc123', 'lead teep', 'Lead Teep Setup')],
        'jab teep': [result('abc123', 'jab teep', 'Lead Teep Setup')],
      }),
    }).gather(collectionId);

    assert.equal(gathered.length, 1);
    assert.equal(gathered[0]?.externalId, 'abc123');
    assert.deepEqual(gathered[0]?.discoveredByQueries, [
      'lead teep',
      'jab teep',
    ]);
  });

  it('returns unique normalized results', async () => {
    const gathered = await service({
      gatherQueries: queries('lead teep'),
      search: providerFromMap({
        'lead teep': [
          result('abc123', 'lead teep', 'Lead Teep Setup'),
          result('def456', 'lead teep', 'Rear Teep'),
        ],
      }),
    }).gather(collectionId);

    assert.equal(gathered.length, 2);
    assert.equal(gathered[0]?.provider, 'youtube');
    assert.equal(
      gathered[0]?.url,
      'https://www.youtube.com/watch?v=abc123',
    );
  });

  it('handles no search queries', async () => {
    await assert.rejects(
      () =>
        service({
          profile: profileWithQueries([]),
          search: providerFromMap({}),
        }).gather(collectionId),
      (error: unknown) => error instanceof ValidationException,
    );
  });

  it('throws when no discovery profile exists', async () => {
    await assert.rejects(
      () =>
        service({
          search: providerFromMap({}),
        }).gather(collectionId),
      (error: unknown) =>
        error instanceof NotFoundException &&
        error.message.includes('Discovery profile'),
    );
  });

  it('falls back to discovery profile search queries', async () => {
    const search = providerFromMap({
      'profile query': [result('a', 'profile query')],
    });

    const gathered = await service({
      profile: profileWithQueries(['profile query']),
      search,
    }).gather(collectionId);

    assert.deepEqual(search.searched, ['profile query']);
    assert.equal(gathered[0]?.externalId, 'a');
  });

  it('keeps successful results when one query fails', async () => {
    const gathered = await service({
      gatherQueries: queries('lead teep', 'broken', 'jab teep'),
      search: providerFromMap({
        'lead teep': [result('a', 'lead teep')],
        broken: new ContentSearchError('YouTube search failed', 'provider'),
        'jab teep': [result('b', 'jab teep')],
      }),
    }).gather(collectionId);

    assert.deepEqual(
      gathered.map((item) => item.externalId),
      ['a', 'b'],
    );
  });

  it('fails when every query fails', async () => {
    await assert.rejects(
      () =>
        service({
          gatherQueries: queries('lead teep', 'jab teep'),
          search: providerFromMap({
            'lead teep': new ContentSearchError('YouTube search failed'),
            'jab teep': new ContentSearchError('YouTube search failed'),
          }),
        }).gather(collectionId),
      (error: unknown) =>
        error instanceof ContentSearchError &&
        error.message === 'YouTube search failed for all queries',
    );
  });

  it('fails fast when the YouTube API key is missing', async () => {
    const search = providerFromMap({
      'lead teep': new ContentSearchError(
        'YouTube API key is not configured',
        'configuration',
      ),
      'jab teep': [result('b', 'jab teep')],
    });

    await assert.rejects(
      () =>
        service({
          gatherQueries: queries('lead teep', 'jab teep'),
          search,
        }).gather(collectionId),
      (error: unknown) =>
        error instanceof ContentSearchError && error.kind === 'configuration',
    );
    assert.deepEqual(search.searched, ['lead teep']);
  });
});
