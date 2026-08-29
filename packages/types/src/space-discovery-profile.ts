import { z } from 'zod';

export const spaceDiscoveryProfileSchema = z.object({
  topics: z.array(z.string().min(1)).min(1),
  searchQueries: z.array(z.string().min(1)).min(1),
  positiveSignals: z.array(z.string().min(1)).default([]),
  negativeSignals: z.array(z.string().min(1)).default([]),
  contentPreferences: z
    .object({
      formats: z.array(z.string().min(1)).optional(),
      skillLevel: z.string().min(1).optional(),
      minDurationMinutes: z.number().nonnegative().optional(),
      maxDurationMinutes: z.number().nonnegative().optional(),
    })
    .optional(),
});

export type SpaceDiscoveryProfile = z.infer<typeof spaceDiscoveryProfileSchema>;
