import { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';

import { CollectionNotFoundError } from '../../../../packages/discovery/src';
import { generateCollectionDiscoveryProfilePayloadSchema } from '../../../../packages/types/src';
import { UnretryableJobError } from '../jobs/job-types';
import { runGenerateCollectionDiscoveryProfile } from '../services/collection-discovery-profile.service';

export function createGenerateCollectionDiscoveryProfileHandler(
  db: PrismaClient,
) {
  return async (job: { payload: unknown }): Promise<void> => {
    let collectionId: string;
    try {
      collectionId =
        generateCollectionDiscoveryProfilePayloadSchema.parse(
          job.payload,
        ).collectionId;
    } catch (error) {
      throw new UnretryableJobError(
        error instanceof ZodError
          ? `Invalid job payload: ${error.message}`
          : 'Invalid job payload',
      );
    }

    try {
      await runGenerateCollectionDiscoveryProfile(db, collectionId);
    } catch (error) {
      if (error instanceof CollectionNotFoundError) {
        throw new UnretryableJobError(error.message);
      }
      throw error;
    }
  };
}
