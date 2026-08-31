import { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';

import {
  CollectionNotFoundError,
  ContentSearchError,
} from '../../../../packages/discovery/src';
import {
  gatherCollectionPayloadSchema,
  gatherJobFailureMessage,
} from '../../../../packages/types/src';
import { UnretryableJobError } from '../jobs/job-types';
import { runGatherCollection } from '../services/gather-collection.service';

export function createGatherCollectionHandler(db: PrismaClient) {
  return async (job: { payload: unknown }): Promise<void> => {
    let collectionId: string;
    try {
      collectionId =
        gatherCollectionPayloadSchema.parse(job.payload).collectionId;
    } catch (error) {
      throw new UnretryableJobError(
        error instanceof ZodError
          ? `Invalid job payload: ${error.message}`
          : 'Invalid job payload',
      );
    }

    try {
      await runGatherCollection(db, collectionId);
    } catch (error) {
      if (error instanceof CollectionNotFoundError) {
        throw new UnretryableJobError(error.message);
      }
      if (error instanceof ContentSearchError && error.kind === 'rate_limit') {
        throw new UnretryableJobError(gatherJobFailureMessage('rate_limit'));
      }
      if (
        error instanceof ContentSearchError &&
        error.kind === 'configuration'
      ) {
        throw new UnretryableJobError(error.message);
      }
      throw error;
    }
  };
}
