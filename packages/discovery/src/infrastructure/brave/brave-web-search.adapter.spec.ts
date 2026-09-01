import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ContentSearchError } from '../../application/errors/content-search.error';
import type { ContentSearchProvider } from '../../application/ports/content-search-provider.port';
import {
  BraveWebSearchAdapter,
  type BraveFetch,
} from './brave-web-search.adapter';

const query = 'irenaeus tertullian dating';

const validResult = {
  title: 'Dating Irenaeus',
  url: 'https://example.edu/irenaeus',
  description: 'A scholarly overview of Irenaeus chronology.',
  age: '2024-10-08T10:30:00.000Z',
  extra_snippets: ['He wrote Against Heresies in the late second century.'],
  thumbnail: { src: 'https://example.edu/thumb.jpg' },
  profile: { name: 'Example University' },
  meta_url: { hostname: 'example.edu' },
};

function fetchReturning(
  status: number,
  body: unknown,
  captured: Array<{ url: string; token?: string }> = [],
): BraveFetch {
  return async (input, init) => {
    captured.push({
      url: String(input),
      token: init?.headers?.['X-Subscription-Token'],
    });
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

describe('BraveWebSearchAdapter', () => {
  it('maps a valid Brave web result correctly', async () => {
    const adapter: ContentSearchProvider = new BraveWebSearchAdapter({
      apiKey: 'test-token',
      fetch: fetchReturning(200, { web: { results: [validResult] } }),
    });

    const results = await adapter.search(query);

    assert.equal(results.length, 1);
    assert.deepEqual(results[0], {
      provider: 'brave',
      externalId: 'https://example.edu/irenaeus',
      title: 'Dating Irenaeus',
      description:
        'A scholarly overview of Irenaeus chronology.\nHe wrote Against Heresies in the late second century.',
      url: 'https://example.edu/irenaeus',
      contentType: 'article',
      thumbnailUrl: 'https://example.edu/thumb.jpg',
      authorName: 'Example University',
      publishedAt: '2024-10-08T10:30:00.000Z',
      discoveredByQueries: [query],
    });
  });

  it('sends the subscription token header and does not put it in the URL', async () => {
    const captured: Array<{ url: string; token?: string }> = [];
    const adapter = new BraveWebSearchAdapter({
      apiKey: 'super-secret-token',
      fetch: fetchReturning(200, { web: { results: [] } }, captured),
    });

    await adapter.search(query);

    assert.equal(captured[0]?.token, 'super-secret-token');
    assert.equal(captured[0]?.url.includes('super-secret-token'), false);
    assert.match(captured[0]?.url ?? '', /extra_snippets=true/);
  });

  it('ignores results without a url', async () => {
    const adapter = new BraveWebSearchAdapter({
      apiKey: 'test-token',
      fetch: fetchReturning(200, {
        web: {
          results: [{ title: 'Missing url' }, validResult],
        },
      }),
    });

    const results = await adapter.search(query);
    assert.equal(results.length, 1);
    assert.equal(results[0]?.url, validResult.url);
  });

  it('uses a generic thumbnail when Brave omits one', async () => {
    const adapter = new BraveWebSearchAdapter({
      apiKey: 'test-token',
      fetch: fetchReturning(200, {
        web: {
          results: [{ title: 'No thumb', url: 'https://example.edu/plain' }],
        },
      }),
    });

    const results = await adapter.search(query);
    assert.equal(results.length, 1);
    assert.equal(
      results[0]?.thumbnailUrl?.startsWith('data:image/svg+xml'),
      true,
    );
  });

  it('handles empty results', async () => {
    const adapter = new BraveWebSearchAdapter({
      apiKey: 'test-token',
      fetch: fetchReturning(200, { web: { results: [] } }),
    });

    assert.deepEqual(await adapter.search(query), []);
  });

  it('classifies HTTP 429 as a rate limit', async () => {
    const adapter = new BraveWebSearchAdapter({
      apiKey: 'test-token',
      fetch: fetchReturning(429, {
        type: 'ErrorResponse',
        error: { code: 'RATE_LIMITED', detail: 'Too many requests' },
      }),
    });

    await assert.rejects(
      () => adapter.search(query),
      (error: unknown) =>
        error instanceof ContentSearchError &&
        error.kind === 'rate_limit' &&
        error.details.status === 429 &&
        !error.message.includes('test-token'),
    );
  });

  it('fails clearly when the API key is missing', async () => {
    const adapter = new BraveWebSearchAdapter({ apiKey: '' });
    await assert.rejects(
      () => adapter.search(query),
      (error: unknown) =>
        error instanceof ContentSearchError &&
        error.kind === 'configuration' &&
        error.message === 'Brave Search API key is not configured',
    );
  });
});
