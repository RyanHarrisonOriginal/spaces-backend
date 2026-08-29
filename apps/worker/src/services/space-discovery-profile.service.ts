import { PrismaClient } from '@prisma/client';

import {
  findSpaceForDiscovery,
  persistSpaceDiscoveryProfile,
} from '../../../../packages/db/src';
import { generateSpaceDiscoveryProfile } from '../../../../packages/discovery/src';
import { UnretryableJobError } from '../jobs/job-types';
import { logger } from '../logger';

export async function runGenerateSpaceDiscoveryProfile(
  db: PrismaClient,
  input: { jobId: string; spaceId: string },
): Promise<void> {
  const space = await findSpaceForDiscovery(db, input.spaceId);
  if (!space) {
    throw new UnretryableJobError(`Space '${input.spaceId}' not found`);
  }

  const profile = await generateSpaceDiscoveryProfile(space);
  const saved = await persistSpaceDiscoveryProfile(db, {
    spaceId: space.id,
    jobId: input.jobId,
    profile,
  });

  logger.info('space discovery profile persisted', {
    jobId: input.jobId,
    spaceId: space.id,
    profileId: saved.id,
    version: saved.version,
    created: saved.created,
  });
}
