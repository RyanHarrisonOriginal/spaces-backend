import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ContentSearchError } from '../../application/errors/content-search.error';
import type { ContentSearchProvider } from '../../application/ports/content-search-provider.port';
import { YoutubeSearchAdapter, type YoutubeFetch } from './youtube-search.adapter';

const query = 'southpaw lead teep setups';

const validItem = {
  id: { kind: 'youtube#video', videoId: 'abc123' },
  snippet: {
    title: 'Lead Teep Setup',
    description: 'How to set up the lead teep.',
    channelTitle: 'Example Channel',
    publishedAt: '2026-01-01T00:00:00Z',
    thumbnails: {
      default: { url: 'https://i.ytimg.com/vi/abc123/default.jpg' },
      medium: { url: 'https://i.ytimg.com/vi/abc123/mqdefault.jpg' },
      high: { url: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg' },
    },
  },
};

function fetchReturning(
  status: number,
  body: unknown,
  captured: Array<{ url: string }> = [],
): YoutubeFetch {
  return async (input) => {
    captured.push({ url: String(input) });
    const text = JSON.stringify(body);
    return {
      ok: status >= 200 && status < 300,
      status,
      async text() {
        return text;
      },
    };
  };
}

describe('YoutubeSearchAdapter', () => {
  it('maps a valid YouTube search result correctly', async () => {
    const adapter: ContentSearchProvider = new YoutubeSearchAdapter({
      apiKey: 'test-key',
      fetch: fetchReturning(200, { items: [validItem] }),
    });

    const results = await adapter.search(query);

    assert.equal(results.length, 1);
    assert.deepEqual(results[0], {
      provider: 'youtube',
      externalId: 'abc123',
      title: 'Lead Teep Setup',
      description: 'How to set up the lead teep.',
      url: 'https://www.youtube.com/watch?v=abc123',
      thumbnailUrl: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
      authorName: 'Example Channel',
      publishedAt: '2026-01-01T00:00:00Z',
      discoveredByQueries: [query],
    });
  });

  it('includes the originating search query', async () => {
    const adapter = new YoutubeSearchAdapter({
      apiKey: 'test-key',
      fetch: fetchReturning(200, { items: [validItem] }),
    });

    const results = await adapter.search(query);
    assert.deepEqual(results[0]?.discoveredByQueries, [query]);
  });

  it('ignores items without a videoId', async () => {
    const adapter = new YoutubeSearchAdapter({
      apiKey: 'test-key',
      fetch: fetchReturning(200, {
        items: [
          { id: { kind: 'youtube#channel' }, snippet: { title: 'Channel' } },
          validItem,
          { id: { videoId: '   ' }, snippet: { title: 'Blank' } },
        ],
      }),
    });

    const results = await adapter.search(query);
    assert.equal(results.length, 1);
    assert.equal(results[0]?.externalId, 'abc123');
  });

  it('handles empty results', async () => {
    const adapter = new YoutubeSearchAdapter({
      apiKey: 'test-key',
      fetch: fetchReturning(200, { items: [] }),
    });

    const results = await adapter.search(query);
    assert.deepEqual(results, []);
  });

  it('handles a missing items array as empty results', async () => {
    const adapter = new YoutubeSearchAdapter({
      apiKey: 'test-key',
      fetch: fetchReturning(200, {}),
    });

    const results = await adapter.search(query);
    assert.deepEqual(results, []);
  });

  it('handles YouTube API errors without leaking the API key', async () => {
    const captured: Array<{ url: string }> = [];
    const adapter = new YoutubeSearchAdapter({
      apiKey: 'super-secret-key',
      fetch: fetchReturning(
        403,
        { error: { code: 403, message: 'quota exceeded' } },
        captured,
      ),
    });

    await assert.rejects(
      () => adapter.search(query),
      (error: unknown) =>
        error instanceof ContentSearchError &&
        error.message === 'YouTube search is temporarily unavailable' &&
        !error.message.includes('super-secret-key'),
    );
    assert.match(captured[0]?.url ?? '', /key=super-secret-key/);
  });

  it('treats malformed JSON as an unexpected response', async () => {
    const adapter = new YoutubeSearchAdapter({
      apiKey: 'test-key',
      fetch: async () => ({
        ok: true,
        status: 200,
        async text() {
          return 'not-json';
        },
      }),
    });

    await assert.rejects(
      () => adapter.search(query),
      (error: unknown) =>
        error instanceof ContentSearchError &&
        error.message === 'YouTube returned an unexpected response',
    );
  });

  it('fails clearly when the API key is missing', async () => {
    const adapter = new YoutubeSearchAdapter({
      apiKey: '',
      fetch: fetchReturning(200, { items: [] }),
    });

    await assert.rejects(
      () => adapter.search(query),
      (error: unknown) =>
        error instanceof ContentSearchError &&
        error.kind === 'configuration' &&
        error.message === 'YouTube API key is not configured',
    );
  });
});
