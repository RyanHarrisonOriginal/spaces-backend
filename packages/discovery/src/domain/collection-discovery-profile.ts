import { z } from 'zod';

export const collectionDiscoveryProfileSchema = z.object({
  topics: z.array(z.string().min(1)).min(1),
  searchQueries: z.array(z.string().min(1)).min(1),
  positiveSignals: z.array(z.string().min(1)).min(1),
  negativeSignals: z.array(z.string().min(1)).min(1),
});

export type CollectionDiscoveryProfile = z.infer<
  typeof collectionDiscoveryProfileSchema
>;
