import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { GatherCollectionCommand } from '../gather-collection.command';
import { GatherCollectionHandler } from './gather-collection.handler';

describe('GatherCollectionHandler', () => {
  it('enqueues the gather job after authorizing the collection', async () => {
    const authorized: string[] = [];
    const enqueued: string[] = [];
    const handler = new GatherCollectionHandler(
      {
        async requireOwnedCollection(userId: string, collectionId: string) {
          authorized.push(`${userId}:${collectionId}`);
          return {} as never;
        },
      } as never,
      async (collectionId) => {
        enqueued.push(collectionId);
        return { id: 'job-1' };
      },
    );

    const result = await handler.execute(
      new GatherCollectionCommand('user-1', 'collection-1'),
    );

    assert.deepEqual(authorized, ['user-1:collection-1']);
    assert.deepEqual(enqueued, ['collection-1']);
    assert.deepEqual(result, { jobId: 'job-1' });
  });

  it('does not import search, LLM evaluation, or content persistence', () => {
    const source = readFileSync(
      join(__dirname, 'gather-collection.handler.ts'),
      'utf8',
    );

    assert.match(source, /enqueueGatherCollection/);
    assert.doesNotMatch(source, /BraveSearchAdapter/);
    assert.doesNotMatch(source, /ContentSearchService/);
    assert.doesNotMatch(source, /ContentRelevance/);
    assert.doesNotMatch(source, /OpenAiAdapter/);
    assert.doesNotMatch(source, /PrismaContentItemRepository/);
    assert.doesNotMatch(source, /ContentItem/);
  });
});
