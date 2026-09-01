import { z } from 'zod';

export const braveThumbnailSchema = z
  .object({
    src: z.string().min(1).optional(),
    original: z.string().min(1).optional(),
  })
  .passthrough();

export const braveMetaUrlSchema = z
  .object({
    hostname: z.string().optional(),
  })
  .passthrough()
  .optional();
