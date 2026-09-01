import { z } from 'zod';

import { braveMetaUrlSchema, braveThumbnailSchema } from './brave-search.schema';

export const braveVideoSearchResultSchema = z
  .object({
    title: z.string().optional(),
    url: z.string().optional(),
    description: z.string().optional(),
    age: z.string().optional(),
    thumbnail: braveThumbnailSchema.optional(),
    meta_url: braveMetaUrlSchema,
    video: z
      .object({
        creator: z.string().optional(),
        publisher: z.string().optional(),
        duration: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const braveVideoSearchResponseSchema = z
  .object({
    results: z.array(braveVideoSearchResultSchema).optional(),
  })
  .passthrough();
