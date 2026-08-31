import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { gatherJobFailureMessage } from '../../../../../../packages/types/src';
import { NotFoundException } from '../../../../../shared/domain/exceptions';
import { GetGatherJobQuery } from '../get-gather-job.query';
import { GetGatherJobHandler } from './get-gather-job.handler';

function accessService() {
  const authorized: string[] = [];
  return {
    authorized,
    service: {
      async requireOwnedCollection(userId: string, collectionId: string) {
        authorized.push(`${userId}:${collectionId}`);
        return {} as never;
      },
    } as never,
  };
}

describe('GetGatherJobHandler', () => {
  it('returns rate_limit when the job failed with a RATE_LIMIT reason', async () => {
    const access = accessService();
    const handler = new GetGatherJobHandler(access.service, async () => ({
      id: '25',
      collectionId: 'collection-1',
      state: 'failed',
      failedReason: gatherJobFailureMessage('rate_limit'),
    }));

    const result = await handler.execute(
      new GetGatherJobQuery('user-1', 'collection-1', '25'),
    );

    assert.deepEqual(access.authorized, ['user-1:collection-1']);
    assert.deepEqual(result, {
      jobId: '25',
      status: 'failed',
      errorCode: 'rate_limit',
    });
  });

  it('returns a generic failed code for other job failures', async () => {
    const access = accessService();
    const handler = new GetGatherJobHandler(access.service, async () => ({
      id: '26',
      collectionId: 'collection-1',
      state: 'failed',
      failedReason: 'YouTube search failed for all queries',
    }));

    const result = await handler.execute(
      new GetGatherJobQuery('user-1', 'collection-1', '26'),
    );

    assert.deepEqual(result, {
      jobId: '26',
      status: 'failed',
      errorCode: 'failed',
    });
  });

  it('maps waiting jobs to queued', async () => {
    const access = accessService();
    const handler = new GetGatherJobHandler(access.service, async () => ({
      id: '27',
      collectionId: 'collection-1',
      state: 'waiting',
      failedReason: null,
    }));

    const result = await handler.execute(
      new GetGatherJobQuery('user-1', 'collection-1', '27'),
    );

    assert.deepEqual(result, { jobId: '27', status: 'queued' });
  });

  it('returns 404 when the job is missing', async () => {
    const access = accessService();
    const handler = new GetGatherJobHandler(access.service, async () => null);

    await assert.rejects(
      () =>
        handler.execute(new GetGatherJobQuery('user-1', 'collection-1', '99')),
      (error: unknown) =>
        error instanceof NotFoundException &&
        error.message === "Gather job '99' not found",
    );
  });

  it('returns 404 when the job belongs to another collection', async () => {
    const access = accessService();
    const handler = new GetGatherJobHandler(access.service, async () => ({
      id: '25',
      collectionId: 'other-collection',
      state: 'failed',
      failedReason: gatherJobFailureMessage('rate_limit'),
    }));

    await assert.rejects(
      () =>
        handler.execute(new GetGatherJobQuery('user-1', 'collection-1', '25')),
      (error: unknown) => error instanceof NotFoundException,
    );
  });
});
