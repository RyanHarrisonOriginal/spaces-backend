import { ZodError } from 'zod';

import {
  ContentSearchError,
  isYoutubeRateLimit,
} from '../../application/errors/content-search.error';
import type {
  ContentSearchProvider,
  ContentSearchResult,
} from '../../application/ports/content-search-provider.port';
import { YoutubeSearchMapper } from './youtube-search.mapper';

const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';
const DEFAULT_MAX_RESULTS = 8;

export type YoutubeFetch = (
  input: string | URL,
  init?: { method?: string; signal?: AbortSignal },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export class YoutubeSearchAdapter implements ContentSearchProvider {
  private apiKey: string;
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
    const apiKey = this.resolveApiKey();
    if (!apiKey) {
      throw new ContentSearchError(
        'YouTube API key is not configured',
        'configuration',
      );
    }

    const url = this.buildSearchUrl(query, apiKey);
    let response: Awaited<ReturnType<YoutubeFetch>>;
    try {
      response = await this.fetchFn(url, {
        signal: AbortSignal.timeout(12_000),
      });
    } catch (error) {
      const timedOut =
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError');
      throw new ContentSearchError(
        timedOut
          ? 'YouTube search request timed out'
          : 'YouTube search request failed',
        'provider',
        { cause: timedOut ? 'timeout' : 'network' },
      );
    }

    let body: unknown;
    try {
      const text = await response.text();
      body = text ? (JSON.parse(text) as unknown) : null;
    } catch {
      throw new ContentSearchError(
        'YouTube returned an unexpected response',
        'provider',
        { status: response.status },
      );
    }

    if (!response.ok) {
      const details = detailsForYoutubeFailure(response.status, body);
      throw new ContentSearchError(
        messageForYoutubeFailure(response.status, body),
        isYoutubeRateLimit(details) ? 'rate_limit' : 'provider',
        details,
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

  private resolveApiKey(): string {
    const key = (this.apiKey || process.env.YOUTUBE_API_KEY || '').trim();
    if (key) {
      this.apiKey = key;
    }
    return key;
  }

  private buildSearchUrl(query: string, apiKey: string): URL {
    const url = new URL(YOUTUBE_SEARCH_URL);
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('q', query);
    url.searchParams.set('order', 'relevance');
    url.searchParams.set('maxResults', String(this.maxResults));
    url.searchParams.set('key', apiKey);
    return url;
  }
}

function messageForYoutubeFailure(status: number, body: unknown): string {
  const { reason, message } = youtubeErrorFromBody(body);
  const parts = [`YouTube search failed (HTTP ${status})`];
  if (reason) {
    parts.push(`reason=${reason}`);
  }
  if (message) {
    parts.push(message);
  }
  return parts.join(': ');
}

function detailsForYoutubeFailure(
  status: number,
  body: unknown,
): Record<string, unknown> {
  const { reason, message } = youtubeErrorFromBody(body);
  return {
    status,
    ...(reason ? { reason } : {}),
    ...(message ? { youtubeMessage: message } : {}),
  };
}

function youtubeErrorFromBody(body: unknown): {
  reason?: string;
  message?: string;
} {
  if (!body || typeof body !== 'object') {
    return {};
  }

  const error = (body as { error?: unknown }).error;
  if (!error || typeof error !== 'object') {
    return {};
  }

  const record = error as {
    message?: unknown;
    errors?: Array<{ reason?: unknown }>;
  };
  const reason = record.errors?.find(
    (item) => typeof item?.reason === 'string' && item.reason.trim(),
  )?.reason;
  const message =
    typeof record.message === 'string' ? sanitizeYoutubeMessage(record.message) : '';

  return {
    ...(typeof reason === 'string' ? { reason: reason.trim() } : {}),
    ...(message ? { message } : {}),
  };
}

function sanitizeYoutubeMessage(value: string): string {
  const stripped = value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!stripped || /key=/i.test(stripped)) {
    return '';
  }
  return stripped.slice(0, 200);
}
