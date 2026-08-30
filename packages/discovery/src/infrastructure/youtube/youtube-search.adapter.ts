import { ZodError } from 'zod';

import { ContentSearchError } from '../../application/errors/content-search.error';
import type {
  ContentSearchProvider,
  ContentSearchResult,
} from '../../application/ports/content-search-provider.port';
import { YoutubeSearchMapper } from './youtube-search.mapper';

const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const DEFAULT_MAX_RESULTS = 8;

export type YoutubeFetch = (
  input: string | URL,
  init?: { method?: string },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export class YoutubeSearchAdapter implements ContentSearchProvider {
  private readonly apiKey: string;
  private readonly maxResults: number;
  private readonly fetchFn: YoutubeFetch;
  private readonly mapper: YoutubeSearchMapper;

  constructor(options: {
    apiKey?: string;
    maxResults?: number;
    fetch?: YoutubeFetch;
    mapper?: YoutubeSearchMapper;
  } = {}) {
    this.apiKey = options.apiKey ?? process.env.YOUTUBE_API_KEY ?? '';
    this.maxResults = options.maxResults ?? DEFAULT_MAX_RESULTS;
    this.fetchFn = options.fetch ?? fetch;
    this.mapper = options.mapper ?? new YoutubeSearchMapper();
  }

  static fromEnv(): YoutubeSearchAdapter {
    return new YoutubeSearchAdapter({
      apiKey: process.env.YOUTUBE_API_KEY,
    });
  }

  async search(query: string): Promise<ContentSearchResult[]> {
    if (!this.apiKey.trim()) {
      throw new ContentSearchError(
        'YouTube API key is not configured',
        'configuration',
      );
    }

    const url = this.buildSearchUrl(query);
    let response: Awaited<ReturnType<YoutubeFetch>>;
    try {
      response = await this.fetchFn(url);
    } catch {
      throw new ContentSearchError('YouTube search request failed', 'provider');
    }

    let body: unknown;
    try {
      const text = await response.text();
      body = text ? (JSON.parse(text) as unknown) : null;
    } catch {
      throw new ContentSearchError(
        'YouTube returned an unexpected response',
        'provider',
      );
    }

    if (!response.ok) {
      throw new ContentSearchError(
        messageForYoutubeStatus(response.status),
        'provider',
      );
    }

    try {
      return this.mapper.toSearchResults(body, query);
    } catch (error) {
      if (error instanceof ZodError || error instanceof ContentSearchError) {
        throw new ContentSearchError(
          'YouTube returned an unexpected response',
          'provider',
        );
      }
      throw error;
    }
  }

  private buildSearchUrl(query: string): URL {
    const url = new URL(YOUTUBE_SEARCH_URL);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('q', query);
    url.searchParams.set('order', 'relevance');
    url.searchParams.set('maxResults', String(this.maxResults));
    url.searchParams.set('key', this.apiKey);
    return url;
  }
}

function messageForYoutubeStatus(status: number): string {
  if (status === 401 || status === 403) {
    return 'YouTube search is temporarily unavailable';
  }
  if (status === 400) {
    return 'YouTube rejected the search query';
  }
  return 'YouTube search failed';
}
