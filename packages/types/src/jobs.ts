import { z } from 'zod';

export const JOB_TYPES = {
  GENERATE_COLLECTION_DISCOVERY_PROFILE:
    'generate_collection_discovery_profile',
  GATHER_COLLECTION: 'gather_collection',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

export const collectionIdJobPayloadSchema = z.object({
  collectionId: z.string().uuid(),
});

export const generateCollectionDiscoveryProfilePayloadSchema =
  collectionIdJobPayloadSchema;
export const gatherCollectionPayloadSchema = collectionIdJobPayloadSchema;

export type GenerateCollectionDiscoveryProfilePayload = z.infer<
  typeof generateCollectionDiscoveryProfilePayloadSchema
>;
export type GatherCollectionPayload = z.infer<
  typeof gatherCollectionPayloadSchema
>;

export type JobPayloadMap = {
  [JOB_TYPES.GENERATE_COLLECTION_DISCOVERY_PROFILE]: GenerateCollectionDiscoveryProfilePayload;
  [JOB_TYPES.GATHER_COLLECTION]: GatherCollectionPayload;
};

export type EnqueueJobInput<T extends JobType = JobType> = {
  type: T;
  payload: JobPayloadMap[T];
};

export const GATHER_JOB_FAILURE = {
  RATE_LIMIT: 'RATE_LIMIT',
} as const;

export type GatherJobFailureCode = 'rate_limit';

export function gatherJobFailureCode(
  failedReason: string | null | undefined,
): GatherJobFailureCode | null {
  if (!failedReason) {
    return null;
  }
  return failedReason.startsWith(`${GATHER_JOB_FAILURE.RATE_LIMIT}:`)
    ? 'rate_limit'
    : null;
}

export function gatherJobFailureMessage(code: GatherJobFailureCode): string {
  return `${GATHER_JOB_FAILURE.RATE_LIMIT}: Brave search rate limit exceeded`;
}
