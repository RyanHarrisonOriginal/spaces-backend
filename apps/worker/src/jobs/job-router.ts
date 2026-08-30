import { PrismaClient } from '@prisma/client';

import { JOB_TYPES } from '../../../../packages/types/src';
import { createGenerateCollectionDiscoveryProfileHandler } from '../handlers/generate-collection-discovery-profile';
import { JobHandler, UnretryableJobError } from './job-types';

export function createJobRouter(db: PrismaClient): (job: {
  id: string;
  type: string;
  payload: unknown;
}) => Promise<void> {
  const handlers: Record<string, JobHandler> = {
    [JOB_TYPES.GENERATE_COLLECTION_DISCOVERY_PROFILE]:
      createGenerateCollectionDiscoveryProfileHandler(db),
  };

  return async (job) => {
    const handler = handlers[job.type];
    if (!handler) {
      throw new UnretryableJobError(`Unknown job type: ${job.type}`);
    }
    await handler(job);
  };
}
