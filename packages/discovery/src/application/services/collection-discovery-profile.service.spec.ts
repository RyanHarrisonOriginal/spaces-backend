import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { describe, it } from 'node:test';
import { ZodError } from 'zod';

import type { CollectionDiscoveryProfile } from '../../domain/collection-discovery-profile';
import {
  CollectionDiscoveryProfileRepository,
  PersistedCollectionDiscoveryProfile,
} from '../../domain/collection-discovery-profile.repository';
import { LlmGenerationError } from '../errors/llm-generation.error';
import type { LlmProvider } from '../ports/llm-provider.port';
import { COLLECTION_DISCOVERY_PROFILE_PROMPT_VERSION } from '../prompts/collection-discovery-profile.prompt';
import { CollectionDiscoveryProfileService } from './collection-discovery-profile.service';

const validProfile: CollectionDiscoveryProfile = {
  topics: ['jab', 'teep', 'southpaw offense'],
  searchQueries: [
    'muay thai jab teep combination technique',
    'jab to lead teep setup',
    'using jab to disguise teep muay thai',
  ],
  positiveSignals: [
    'technique breakdown',
    'southpaw demonstrations',
    'combination drilling',
  ],
  negativeSignals: [
    'highlights only',
    'general fitness boxing',
    'clickbait titles',
  ],
};

class InMemoryCollectionDiscoveryProfileRepository extends CollectionDiscoveryProfileRepository {
  readonly records: PersistedCollectionDiscoveryProfile[] = [];

  async get(
    collectionId: string,
  ): Promise<PersistedCollectionDiscoveryProfile | null> {
    return (
      this.records
        .filter((row) => row.collectionId === collectionId)
        .sort((a, b) => b.version - a.version)[0] ?? null
    );
  }

  async save(
    record: PersistedCollectionDiscoveryProfile,
  ): Promise<PersistedCollectionDiscoveryProfile> {
    for (const row of this.records) {
      if (
        row.collectionId === record.collectionId &&
        row.status === 'active' &&
        row.id !== record.id
      ) {
        row.status = 'superseded';
        row.supersededAt = record.createdAt;
      }
    }

    const existing = this.records.findIndex((row) => row.id === record.id);
    if (existing >= 0) {
      this.records[existing] = record;
    } else {
      this.records.push(record);
    }
    return record;
  }
}

function fakeLlmReturning(data: unknown): LlmProvider {
  return {
    async generateStructured<T>() {
      return {
        data: data as T,
        provider: 'test',
        model: 'fake-model',
      };
    },
  };
}

function fakeLlmFailing(error: Error): LlmProvider {
  return {
    async generateStructured() {
      throw error;
    },
  };
}

describe('CollectionDiscoveryProfileService', () => {
  const input = {
    collectionId: randomUUID(),
    collectionDescription: 'Using the jab and teep together offensively.',
    spaceDescription:
      'Muay Thai technique and strategy that helps me improve as an intermediate southpaw.',
  };

  it('generates and persists a profile from valid LLM output', async () => {
    const profiles = new InMemoryCollectionDiscoveryProfileRepository();
    const service = new CollectionDiscoveryProfileService(
      fakeLlmReturning(validProfile),
      profiles,
    );

    const saved = await service.generateAndPersist(input);

    assert.equal(profiles.records.length, 1);
    assert.deepEqual(saved.profile, validProfile);
    assert.equal(saved.provider, 'test');
    assert.equal(saved.model, 'fake-model');
    assert.equal(
      saved.promptVersion,
      COLLECTION_DISCOVERY_PROFILE_PROMPT_VERSION,
    );
    assert.equal(saved.collectionId, input.collectionId);
  });

  it('rejects invalid LLM output and does not persist', async () => {
    const profiles = new InMemoryCollectionDiscoveryProfileRepository();
    const service = new CollectionDiscoveryProfileService(
      fakeLlmReturning({ topics: [] }),
      profiles,
    );

    await assert.rejects(
      () => service.generateAndPersist(input),
      (error: unknown) => error instanceof ZodError,
    );
    assert.equal(profiles.records.length, 0);
  });

  it('does not persist when the LLM provider fails', async () => {
    const profiles = new InMemoryCollectionDiscoveryProfileRepository();
    const service = new CollectionDiscoveryProfileService(
      fakeLlmFailing(new LlmGenerationError('provider down')),
      profiles,
    );

    await assert.rejects(
      () => service.generateAndPersist(input),
      (error: unknown) =>
        error instanceof LlmGenerationError &&
        error.message === 'provider down',
    );
    assert.equal(profiles.records.length, 0);
  });

  it('assigns version 1 to the first profile', async () => {
    const profiles = new InMemoryCollectionDiscoveryProfileRepository();
    const service = new CollectionDiscoveryProfileService(
      fakeLlmReturning(validProfile),
      profiles,
    );

    const saved = await service.generateAndPersist(input);
    assert.equal(saved.version, 1);
    assert.equal(saved.status, 'active');
    assert.equal(saved.supersededAt, null);
  });

  it('creates version 2 on regeneration instead of overwriting version 1', async () => {
    const profiles = new InMemoryCollectionDiscoveryProfileRepository();
    const service = new CollectionDiscoveryProfileService(
      fakeLlmReturning(validProfile),
      profiles,
    );

    const first = await service.generateAndPersist(input);
    const second = await service.generateAndPersist(input);

    assert.equal(first.version, 1);
    assert.equal(second.version, 2);
    assert.equal(profiles.records.length, 2);
    assert.notEqual(first.id, second.id);
    assert.deepEqual(
      profiles.records.find((row) => row.version === 1)?.profile,
      validProfile,
    );
  });

  it('supersedes the prior active profile', async () => {
    const profiles = new InMemoryCollectionDiscoveryProfileRepository();
    const service = new CollectionDiscoveryProfileService(
      fakeLlmReturning(validProfile),
      profiles,
    );

    await service.generateAndPersist(input);
    const second = await service.generateAndPersist(input);

    const first = profiles.records.find((row) => row.version === 1);
    assert.ok(first);
    assert.equal(first.status, 'superseded');
    assert.ok(first.supersededAt);
    assert.equal(second.status, 'active');
    assert.equal(
      profiles.records.filter((row) => row.status === 'active').length,
      1,
    );
  });

  it('runs against a mocked LlmProvider with no OpenAI client', async () => {
    const service = new CollectionDiscoveryProfileService(
      fakeLlmReturning(validProfile),
      new InMemoryCollectionDiscoveryProfileRepository(),
    );

    const saved = await service.generateAndPersist(input);
    assert.equal(saved.provider, 'test');
  });
});
