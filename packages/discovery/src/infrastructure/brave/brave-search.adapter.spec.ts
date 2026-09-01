import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { genericContentThumbnail } from '../../application/generic-content-thumbnail';
import { ContentSearchError } from '../../application/errors/content-search.error';
import { BraveSearchAdapter } from './brave-search.adapter';
import type { BraveFetch } from './brave-search.client';

const query = 'irenaeus tertullian dating';

function fetchReturning(
  routes: Record<string, { status: number; body: unknown }>,
  captured: string[] = [],
): BraveFetch {
  return async (input, init) => {
    const url = String(input);
    captured.push(url);
    void init;
    const match = Object.entries(routes).find(([path]) => url.includes(path));
    const response = match?.[1] ?? { status: 200, body: { results: [] } };
    const text = JSON.stringify(response.body);
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      async text() {
        return text;
      },
    };
  };
}

describe('BraveSearchAdapter', () => {
  it('searches the selected Brave verticals and maps each content type', async () => {
    const captured: string[] = [];
    const adapter = new BraveSearchAdapter({
      apiKey: 'test-token',
      contentTypes: ['web', 'news', 'video', 'image'],
      fetch: fetchReturning(
        {
          '/web/search': {
            status: 200,
            body: {
              web: {
                results: [
                  {
                    title: 'Web page',
                    url: 'https://example.edu/page',
                    description: 'A page.',
                    thumbnail: { src: 'https://example.edu/web.jpg' },
                  },
                ],
              },
            },
          },
          '/news/search': {
            status: 200,
            body: {
              results: [
                {
                  title: 'News story',
                  url: 'https://example.edu/news',
                  description: 'A story.',
                  source: { name: 'Example News' },
                },
              ],
            },
          },
          '/videos/search': {
            status: 200,
            body: {
              results: [
                {
                  title: 'Lecture',
                  url: 'https://example.edu/video',
                  description: 'A lecture.',
                  thumbnail: { src: 'https://example.edu/video.jpg' },
                  video: { creator: 'Dr. Example' },
                },
              ],
            },
          },
          '/images/search': {
            status: 200,
            body: {
              results: [
                {
                  title: 'Manuscript',
                  url: 'https://example.edu/gallery',
                  properties: { url: 'https://cdn.example.edu/ms.jpg' },
                  thumbnail: { src: 'https://cdn.example.edu/ms-thumb.jpg' },
                  source: 'example.edu',
                },
              ],
            },
          },
        },
        captured,
      ),
    });

    const results = await adapter.search(query);

    assert.deepEqual(
      captured.map((url) => new URL(url).pathname),
      [
        '/res/v1/web/search',
        '/res/v1/news/search',
        '/res/v1/videos/search',
        '/res/v1/images/search',
      ],
    );
    assert.equal(results.length, 4);
    assert.equal(results[0]?.contentType, 'article');
    assert.equal(results[0]?.url, 'https://example.edu/page');
    assert.equal(results[1]?.contentType, 'article');
    assert.equal(results[1]?.title, 'News story');
    assert.equal(results[1]?.thumbnailUrl, genericContentThumbnail('article'));
    assert.equal(results[2]?.contentType, 'video');
    assert.equal(results[2]?.authorName, 'Dr. Example');
    assert.equal(results[3]?.contentType, 'image');
    assert.equal(results[3]?.externalId, 'https://cdn.example.edu/ms.jpg');
    assert.equal(results[3]?.url, 'https://example.edu/gallery');
  });

  it('only requests the content types the collection selected', async () => {
    const captured: string[] = [];
    const adapter = new BraveSearchAdapter({
      apiKey: 'test-token',
      contentTypes: ['video'],
      fetch: fetchReturning(
        {
          '/videos/search': { status: 200, body: { results: [] } },
        },
        captured,
      ),
    });

    await adapter.search(query);

    assert.equal(captured.length, 1);
    assert.match(captured[0] ?? '', /\/videos\/search/);
  });

  it('classifies HTTP 429 as a rate limit', async () => {
    const adapter = new BraveSearchAdapter({
      apiKey: 'test-token',
      contentTypes: ['news'],
      fetch: fetchReturning({
        '/news/search': {
          status: 429,
          body: {
            type: 'ErrorResponse',
            error: { code: 'RATE_LIMITED', detail: 'Too many requests' },
          },
        },
      }),
    });

    await assert.rejects(
      () => adapter.search(query),
      (error: unknown) =>
        error instanceof ContentSearchError &&
        error.kind === 'rate_limit' &&
        error.details.status === 429,
    );
  });

  it('fails clearly when the API key is missing', async () => {
    const adapter = new BraveSearchAdapter({ apiKey: '' });
    await assert.rejects(
      () => adapter.search(query),
      (error: unknown) =>
        error instanceof ContentSearchError &&
        error.kind === 'configuration' &&
        error.message === 'Brave Search API key is not configured',
    );
  });
});
