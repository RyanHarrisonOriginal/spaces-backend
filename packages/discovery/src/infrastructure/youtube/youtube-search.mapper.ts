import {
  CONTENT_SEARCH_PROVIDERS,
  type ContentSearchResult,
} from '../../application/ports/content-search-provider.port';
import { youtubeSearchResponseSchema } from './youtube-search.schema';

const THUMBNAIL_PREFERENCE = [
  'maxres',
  'standard',
  'high',
  'medium',
  'default',
] as const;

export class YoutubeSearchMapper {
  toSearchResults(body: unknown, query: string): ContentSearchResult[] {
    const parsed = youtubeSearchResponseSchema.parse(body);
    const results: ContentSearchResult[] = [];

    for (const item of parsed.items ?? []) {
      const mapped = this.toSearchResult(item, query);
      if (mapped) {
        results.push(mapped);
      }
    }

    return results;
  }

  toSearchResult(
    item: {
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        description?: string;
        channelTitle?: string;
        publishedAt?: string;
        thumbnails?: Partial<
          Record<(typeof THUMBNAIL_PREFERENCE)[number], { url: string }>
        >;
      };
    },
    query: string,
  ): ContentSearchResult | null {
    const videoId = item.id?.videoId?.trim();
    if (!videoId) {
      return null;
    }

    const snippet = item.snippet;
    const thumbnailUrl = this.bestThumbnailUrl(snippet?.thumbnails);
    const title = snippet?.title?.trim() ?? '';
    const description = snippet?.description?.trim() ?? '';
    const authorName = snippet?.channelTitle?.trim();
    const publishedAt = snippet?.publishedAt?.trim();

    return {
      provider: CONTENT_SEARCH_PROVIDERS.youtube,
      externalId: videoId,
      title,
      description,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
      ...(authorName ? { authorName } : {}),
      ...(publishedAt ? { publishedAt } : {}),
      discoveredByQueries: [query],
    };
  }

  private bestThumbnailUrl(
    thumbnails?: Partial<
      Record<(typeof THUMBNAIL_PREFERENCE)[number], { url: string }>
    >,
  ): string | undefined {
    if (!thumbnails) {
      return undefined;
    }
    for (const key of THUMBNAIL_PREFERENCE) {
      const url = thumbnails[key]?.url?.trim();
      if (url) {
        return url;
      }
    }
    return undefined;
  }
}
