import { Queue, createPostgresBackend } from 'bullmq';

import { JOB_TYPES } from '../../types/src';
import { getBullmqConnection } from './connection';

export const JOB_QUEUE_NAME = 'spaces';

function createJobQueue() {
  return new Queue(
    JOB_QUEUE_NAME,
    {
      connection: getBullmqConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    },
    createPostgresBackend,
  );
}

type SpacesQueue = ReturnType<typeof createJobQueue>;

let queue: SpacesQueue | undefined;

export function getJobQueue(): SpacesQueue {
  if (!queue) {
    queue = createJobQueue();
  }
  return queue;
}

export async function closeJobQueue(): Promise<void> {
  if (!queue) return;
  await queue.close();
  queue = undefined;
}

export async function enqueueGenerateCollectionDiscoveryProfile(
  collectionId: string,
): Promise<{ id: string }> {
  const job = await getJobQueue().add(
    JOB_TYPES.GENERATE_COLLECTION_DISCOVERY_PROFILE,
    { collectionId },
  );
  if (!job.id) {
    throw new Error('BullMQ did not return a job id');
  }
  return { id: String(job.id) };
}
