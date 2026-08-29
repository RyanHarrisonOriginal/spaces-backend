import { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';

import { generateSpaceDiscoveryProfilePayloadSchema } from '../../../../packages/types/src';
import { JobHandler, UnretryableJobError } from '../jobs/job-types';
import { runGenerateSpaceDiscoveryProfile } from '../services/space-discovery-profile.service';

export function createGenerateSpaceDiscoveryProfileHandler(
  db: PrismaClient,
): JobHandler {
  return async (job) => {
    let payload;
    try {
      payload = generateSpaceDiscoveryProfilePayloadSchema.parse(job.payload);
    } catch (error) {
      const message =
        error instanceof ZodError ? error.message : 'Invalid job payload';
      throw new UnretryableJobError(message);
    }

    await runGenerateSpaceDiscoveryProfile(db, {
      jobId: job.id,
      spaceId: payload.spaceId,
    });
  };
}
