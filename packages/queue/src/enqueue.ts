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

async function addCollectionJob(
  type:
    | typeof JOB_TYPES.GENERATE_COLLECTION_DISCOVERY_PROFILE
    | typeof JOB_TYPES.GATHER_COLLECTION,
  collectionId: string,
): Promise<{ id: string }> {
  const job = await getJobQueue().add(type, { collectionId });
  if (!job.id) {
    throw new Error('BullMQ did not return a job id');
  }
  return { id: String(job.id) };
}

export async function enqueueGenerateCollectionDiscoveryProfile(
  collectionId: string,
): Promise<{ id: string }> {
  return addCollectionJob(
    JOB_TYPES.GENERATE_COLLECTION_DISCOVERY_PROFILE,
    collectionId,
  );
}

export async function enqueueGatherCollection(
  collectionId: string,
): Promise<{ id: string }> {
  return addCollectionJob(JOB_TYPES.GATHER_COLLECTION, collectionId);
}

export type GatherJobSnapshot = {
  id: string;
  collectionId: string;
  state: string;
  failedReason: string | null;
};

export async function getGatherCollectionJob(
  jobId: string,
): Promise<GatherJobSnapshot | null> {
  const job = await getJobQueue().getJob(jobId);
  if (!job) {
    return null;
  }

  const data = job.data as { collectionId?: unknown };
  const collectionId =
    typeof data?.collectionId === 'string' ? data.collectionId : '';
  const state = await job.getState();

  return {
    id: String(job.id),
    collectionId,
    state,
    failedReason: job.failedReason ?? null,
  };
}
