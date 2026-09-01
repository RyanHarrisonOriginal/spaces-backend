import { thumbnailOrFallback } from '../../application/generic-content-thumbnail';
import {
  CONTENT_SEARCH_PROVIDERS,
  type ContentSearchResult,
} from '../../application/ports/content-search-provider.port';
import { braveImageSearchResponseSchema } from './brave-image-search.schema';

export class BraveImageSearchMapper {
  toSearchResults(body: unknown, query: string): ContentSearchResult[] {
    const parsed = braveImageSearchResponseSchema.parse(body);
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
      source?: string;
      thumbnail?: { src?: string };
      meta_url?: { hostname?: string };
      properties?: { url?: string; placeholder?: string };
    },
    query: string,
  ): ContentSearchResult | null {
    const imageUrl = item.properties?.url?.trim();
    const pageUrl = item.url?.trim();
    const url = pageUrl || imageUrl;
    if (!url) {
      return null;
    }

    const authorName =
      item.source?.trim() || item.meta_url?.hostname?.trim();

    return {
      provider: CONTENT_SEARCH_PROVIDERS.brave,
      externalId: imageUrl || url,
      title: item.title?.trim() ?? url,
      description: '',
      url,
      contentType: 'image',
      thumbnailUrl: thumbnailOrFallback(
        item.thumbnail?.src || item.properties?.placeholder || imageUrl,
        'image',
      ),
      ...(authorName ? { authorName } : {}),
      discoveredByQueries: [query],
    };
  }
}
