import type { ContentSearchProvider, ContentSearchResult } from '../../application/ports/content-search-provider.port';
import {
  braveGetJson,
  mapBraveParseError,
  requireBraveApiKey,
  resolveBraveApiKey,
  type BraveFetch,
} from './brave-search.client';
import { BraveWebSearchMapper } from './brave-web-search.mapper';

const BRAVE_WEB_SEARCH_URL = 'https://api.search.brave.com/res/v1/web/search';
const DEFAULT_COUNT = 8;

export type { BraveFetch };

export class BraveWebSearchAdapter implements ContentSearchProvider {
  private apiKey: string;
  private readonly count: number;
  private readonly fetchFn: BraveFetch;
  private readonly mapper: BraveWebSearchMapper;

  constructor(
    options: {
      apiKey?: string;
      count?: number;
      fetch?: BraveFetch;
      mapper?: BraveWebSearchMapper;
    } = {},
  ) {
    this.apiKey = options.apiKey ?? process.env.BRAVE_SEARCH_API_KEY ?? '';
    this.count = options.count ?? DEFAULT_COUNT;
    this.fetchFn = options.fetch ?? fetch;
    this.mapper = options.mapper ?? new BraveWebSearchMapper();
  }

  static fromEnv(): BraveWebSearchAdapter {
    return new BraveWebSearchAdapter({
      apiKey: process.env.BRAVE_SEARCH_API_KEY,
    });
  }

  async search(query: string): Promise<ContentSearchResult[]> {
    const apiKey = requireBraveApiKey(resolveBraveApiKey(this.apiKey));
    this.apiKey = apiKey;

    const body = await braveGetJson({
      fetch: this.fetchFn,
      apiKey,
      url: this.buildSearchUrl(query),
    });

    try {
      return this.mapper.toSearchResults(body, query);
    } catch (error) {
      mapBraveParseError(error);
    }
  }

  private buildSearchUrl(query: string): URL {
    const url = new URL(BRAVE_WEB_SEARCH_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('count', String(this.count));
    url.searchParams.set('extra_snippets', 'true');
    url.searchParams.set('safesearch', 'moderate');
    return url;
  }
}
