import { thumbnailOrFallback } from '../../application/generic-content-thumbnail';
import {
  CONTENT_SEARCH_PROVIDERS,
  type ContentSearchResult,
} from '../../application/ports/content-search-provider.port';
import { isoDate, joinedDescription } from './brave-search.mapper-utils';
import { braveWebSearchResponseSchema } from './brave-web-search.schema';

export class BraveWebSearchMapper {
  toSearchResults(body: unknown, query: string): ContentSearchResult[] {
    const parsed = braveWebSearchResponseSchema.parse(body);
    const results: ContentSearchResult[] = [];

    for (const item of parsed.web?.results ?? []) {
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
      extra_snippets?: string[];
      thumbnail?: { src?: string };
      profile?: { name?: string };
      meta_url?: { hostname?: string };
    },
    query: string,
  ): ContentSearchResult | null {
    const url = item.url?.trim();
    if (!url) {
      return null;
    }

    const description = joinedDescription(item.description, item.extra_snippets);
    const authorName =
      item.profile?.name?.trim() || item.meta_url?.hostname?.trim();
    const publishedAt = isoDate(item.age);

    return {
      provider: CONTENT_SEARCH_PROVIDERS.brave,
      externalId: url,
      title: item.title?.trim() ?? url,
      description,
      url,
      contentType: 'article',
      thumbnailUrl: thumbnailOrFallback(item.thumbnail?.src, 'article'),
      ...(authorName ? { authorName } : {}),
      ...(publishedAt ? { publishedAt } : {}),
      discoveredByQueries: [query],
    };
  }
}
