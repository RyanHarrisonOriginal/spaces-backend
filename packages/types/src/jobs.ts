import { z } from 'zod';

export const JOB_TYPES = {
  GENERATE_COLLECTION_DISCOVERY_PROFILE:
    'generate_collection_discovery_profile',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

export const generateCollectionDiscoveryProfilePayloadSchema = z.object({
  collectionId: z.string().uuid(),
});

export type GenerateCollectionDiscoveryProfilePayload = z.infer<
  typeof generateCollectionDiscoveryProfilePayloadSchema
>;

export type JobPayloadMap = {
  [JOB_TYPES.GENERATE_COLLECTION_DISCOVERY_PROFILE]: GenerateCollectionDiscoveryProfilePayload;
};

export type EnqueueJobInput<T extends JobType = JobType> = {
  type: T;
  payload: JobPayloadMap[T];
};
