import { z } from 'zod';

const braveThumbnailSchema = z
  .object({
    src: z.string().min(1).optional(),
  })
  .passthrough();

export const braveWebSearchResultSchema = z
  .object({
    title: z.string().optional(),
    url: z.string().optional(),
    description: z.string().optional(),
    age: z.string().optional(),
    extra_snippets: z.array(z.string()).optional(),
    thumbnail: braveThumbnailSchema.optional(),
    profile: z
      .object({
        name: z.string().optional(),
      })
      .passthrough()
      .optional(),
    meta_url: z
      .object({
        hostname: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const braveWebSearchResponseSchema = z
  .object({
    web: z
      .object({
        results: z.array(braveWebSearchResultSchema).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();
