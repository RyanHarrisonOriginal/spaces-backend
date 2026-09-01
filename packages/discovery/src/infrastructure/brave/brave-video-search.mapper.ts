import { thumbnailOrFallback } from '../../application/generic-content-thumbnail';
import {
  CONTENT_SEARCH_PROVIDERS,
  type ContentSearchResult,
} from '../../application/ports/content-search-provider.port';
import { isoDate } from './brave-search.mapper-utils';
import { braveVideoSearchResponseSchema } from './brave-video-search.schema';

export class BraveVideoSearchMapper {
  toSearchResults(body: unknown, query: string): ContentSearchResult[] {
    const parsed = braveVideoSearchResponseSchema.parse(body);
    const results: ContentSearchResult[] = [];

    for (const item of parsed.results ?? []) {
      const mapped = this.toSearchResult(item, query);
      if (mapped) {
        results.push(mapped);
      }
    }

    return results;
  }

  toSearchResult(
    item: {
      title?: string;
      url?: string;
      description?: string;
      age?: string;
      thumbnail?: { src?: string; original?: string };
      meta_url?: { hostname?: string };
      video?: { creator?: string; publisher?: string };
    },
    query: string,
  ): ContentSearchResult | null {
    const url = item.url?.trim();
    if (!url) {
      return null;
    }

    const authorName =
      item.video?.creator?.trim() ||
      item.video?.publisher?.trim() ||
      item.meta_url?.hostname?.trim();
    const publishedAt = isoDate(item.age);

    return {
      provider: CONTENT_SEARCH_PROVIDERS.brave,
      externalId: url,
      title: item.title?.trim() ?? url,
      description: item.description?.trim() ?? '',
      url,
      contentType: 'video',
      thumbnailUrl: thumbnailOrFallback(
        item.thumbnail?.src || item.thumbnail?.original,
        'video',
      ),
      ...(authorName ? { authorName } : {}),
      ...(publishedAt ? { publishedAt } : {}),
      discoveredByQueries: [query],
    };
  }
}
