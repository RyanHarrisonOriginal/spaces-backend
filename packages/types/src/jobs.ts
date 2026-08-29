import { z } from 'zod';

export const JOB_TYPES = {
  GENERATE_SPACE_DISCOVERY_PROFILE: 'generate_space_discovery_profile',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];

export const generateSpaceDiscoveryProfilePayloadSchema = z.object({
  spaceId: z.string().uuid(),
});

export type GenerateSpaceDiscoveryProfilePayload = z.infer<
  typeof generateSpaceDiscoveryProfilePayloadSchema
>;

export type JobPayloadMap = {
  [JOB_TYPES.GENERATE_SPACE_DISCOVERY_PROFILE]: GenerateSpaceDiscoveryProfilePayload;
};

export type EnqueueJobInput<T extends JobType = JobType> = {
  type: T;
  payload: JobPayloadMap[T];
};
