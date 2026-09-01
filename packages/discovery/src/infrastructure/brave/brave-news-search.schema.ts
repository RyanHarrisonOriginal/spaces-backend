import { z } from 'zod';

import { braveMetaUrlSchema, braveThumbnailSchema } from './brave-search.schema';

export const braveNewsSearchResultSchema = z
  .object({
    title: z.string().optional(),
    url: z.string().optional(),
    description: z.string().optional(),
    age: z.string().optional(),
    extra_snippets: z.array(z.string()).optional(),
    thumbnail: braveThumbnailSchema.optional(),
    meta_url: braveMetaUrlSchema,
    source: z
      .object({
        name: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const braveNewsSearchResponseSchema = z
  .object({
    results: z.array(braveNewsSearchResultSchema).optional(),
  })
  .passthrough();
