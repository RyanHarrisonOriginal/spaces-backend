import { z } from 'zod';

const youtubeThumbnailSchema = z
  .object({
    url: z.string().min(1),
  })
  .passthrough();

export const youtubeSearchItemSchema = z
  .object({
    id: z
      .object({
        videoId: z.string().optional(),
      })
      .passthrough()
      .optional(),
    snippet: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        channelTitle: z.string().optional(),
        publishedAt: z.string().optional(),
        thumbnails: z
          .object({
            maxres: youtubeThumbnailSchema.optional(),
            standard: youtubeThumbnailSchema.optional(),
            high: youtubeThumbnailSchema.optional(),
            medium: youtubeThumbnailSchema.optional(),
            default: youtubeThumbnailSchema.optional(),
          })
          .passthrough()
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export const youtubeSearchResponseSchema = z
  .object({
    items: z.array(youtubeSearchItemSchema).optional(),
  })
  .passthrough();
