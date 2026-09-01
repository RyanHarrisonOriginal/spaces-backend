import {
  normalizeBraveContentTypes,
  type BraveContentType,
} from '../../application/brave-content-types';
import { ContentSearchError } from '../../application/errors/content-search.error';
import type {
  ContentSearchProvider,
  ContentSearchResult,
} from '../../application/ports/content-search-provider.port';
import {
  braveGetJson,
  mapBraveParseError,
  requireBraveApiKey,
  resolveBraveApiKey,
  type BraveFetch,
} from './brave-search.client';
import { BraveImageSearchMapper } from './brave-image-search.mapper';
import { BraveNewsSearchMapper } from './brave-news-search.mapper';
import { BraveVideoSearchMapper } from './brave-video-search.mapper';
import { BraveWebSearchMapper } from './brave-web-search.mapper';

const BRAVE_SEARCH_BASE = 'https://api.search.brave.com/res/v1';
const DEFAULT_COUNT = 8;

type VerticalSearch = {
  buildUrl: (query: string, count: number) => URL;
  mapResults: (body: unknown, query: string) => ContentSearchResult[];
};

export class BraveSearchAdapter implements ContentSearchProvider {
  private apiKey: string;
  private readonly count: number;
  private readonly fetchFn: BraveFetch;
  private readonly contentTypes: BraveContentType[];
  private readonly verticals: Record<BraveContentType, VerticalSearch>;

  constructor(
    options: {
      apiKey?: string;
      count?: number;
      fetch?: BraveFetch;
      contentTypes?: readonly string[];
      webMapper?: BraveWebSearchMapper;
      newsMapper?: BraveNewsSearchMapper;
      videoMapper?: BraveVideoSearchMapper;
      imageMapper?: BraveImageSearchMapper;
    } = {},
  ) {
    this.apiKey = options.apiKey ?? process.env.BRAVE_SEARCH_API_KEY ?? '';
    this.count = options.count ?? DEFAULT_COUNT;
    this.fetchFn = options.fetch ?? fetch;
    this.contentTypes = normalizeBraveContentTypes(options.contentTypes);
    const webMapper = options.webMapper ?? new BraveWebSearchMapper();
    const newsMapper = options.newsMapper ?? new BraveNewsSearchMapper();
    const videoMapper = options.videoMapper ?? new BraveVideoSearchMapper();
    const imageMapper = options.imageMapper ?? new BraveImageSearchMapper();
    this.verticals = {
      web: {
        buildUrl: (query, count) =>
          searchUrl(`${BRAVE_SEARCH_BASE}/web/search`, query, {
            count,
            extra_snippets: true,
            safesearch: 'moderate',
          }),
        mapResults: (body, query) => webMapper.toSearchResults(body, query),
      },
      news: {
        buildUrl: (query, count) =>
          searchUrl(`${BRAVE_SEARCH_BASE}/news/search`, query, {
            count,
            extra_snippets: true,
            safesearch: 'moderate',
          }),
        mapResults: (body, query) => newsMapper.toSearchResults(body, query),
      },
      video: {
        buildUrl: (query, count) =>
          searchUrl(`${BRAVE_SEARCH_BASE}/videos/search`, query, {
            count,
            safesearch: 'moderate',
          }),
        mapResults: (body, query) => videoMapper.toSearchResults(body, query),
      },
      image: {
        buildUrl: (query, count) =>
          searchUrl(`${BRAVE_SEARCH_BASE}/images/search`, query, {
            count,
            safesearch: 'strict',
          }),
        mapResults: (body, query) => imageMapper.toSearchResults(body, query),
      },
    };
  }

  static fromEnv(
    options: { contentTypes?: readonly string[] } = {},
  ): BraveSearchAdapter {
    return new BraveSearchAdapter({
      apiKey: process.env.BRAVE_SEARCH_API_KEY,
      contentTypes: options.contentTypes,
    });
  }

  withContentTypes(contentTypes: readonly string[]): BraveSearchAdapter {
    return new BraveSearchAdapter({
      apiKey: this.apiKey,
      count: this.count,
      fetch: this.fetchFn,
      contentTypes,
    });
  }

  async search(query: string): Promise<ContentSearchResult[]> {
    const apiKey = requireBraveApiKey(resolveBraveApiKey(this.apiKey));
    this.apiKey = apiKey;

    const results: ContentSearchResult[] = [];
    for (const contentType of this.contentTypes) {
      const vertical = this.verticals[contentType];
      try {
        const body = await braveGetJson({
          fetch: this.fetchFn,
          apiKey,
          url: vertical.buildUrl(query, this.count),
        });
        try {
          results.push(...vertical.mapResults(body, query));
        } catch (error) {
          mapBraveParseError(error);
        }
      } catch (error) {
        if (
          error instanceof ContentSearchError &&
          (error.kind === 'rate_limit' || error.kind === 'configuration')
        ) {
          throw error;
        }
        if (this.contentTypes.length === 1) {
          throw error;
        }
      }
    }

    return results;
  }
}

function searchUrl(
  href: string,
  query: string,
  params: Record<string, string | number | boolean>,
): URL {
  const url = new URL(href);
  url.searchParams.set('q', query);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return url;
}
