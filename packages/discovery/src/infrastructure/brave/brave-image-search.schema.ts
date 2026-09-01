import { z } from 'zod';

import { braveMetaUrlSchema, braveThumbnailSchema } from './brave-search.schema';

export const braveImageSearchResultSchema = z
  .object({
    title: z.string().optional(),
    url: z.string().optional(),
    source: z.string().optional(),
    thumbnail: braveThumbnailSchema.optional(),
    meta_url: braveMetaUrlSchema,
    properties: z
      .object({
        url: z.string().optional(),
        placeholder: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const braveImageSearchResponseSchema = z
  .object({
    results: z.array(braveImageSearchResultSchema).optional(),
  })
  .passthrough();
