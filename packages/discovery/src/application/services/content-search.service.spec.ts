import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ContentSearchError } from '../errors/content-search.error';
import type {
  ContentSearchProvider,
  ContentSearchResult,
} from '../ports/content-search-provider.port';
import { ContentSearchService } from './content-search.service';

function result(
  externalId: string,
  query: string,
  title = externalId,
): ContentSearchResult {
  return {
    provider: 'youtube',
    externalId,
    title,
    description: `${title} description`,
    url: `https://www.youtube.com/watch?v=${externalId}`,
    discoveredByQueries: [query],
  };
}

function providerFromMap(
  responses: Record<string, ContentSearchResult[] | Error>,
): ContentSearchProvider & { searched: string[] } {
  const searched: string[] = [];
  return {
    searched,
    async search(query: string) {
      searched.push(query);
      const response = responses[query];
      if (response instanceof Error) {
        throw response;
      }
      return response ?? [];
    },
  };
}

describe('ContentSearchService', () => {
  it('executes each generated search query', async () => {
    const search = providerFromMap({
      'lead teep': [result('a', 'lead teep')],
      'jab teep': [result('b', 'jab teep')],
    });

    const gathered = await new ContentSearchService(search).searchQueries([
      'lead teep',
      'jab teep',
    ]);

    assert.deepEqual(search.searched, ['lead teep', 'jab teep']);
    assert.equal(gathered.length, 2);
  });

  it('combines results from every query', async () => {
    const gathered = await new ContentSearchService(
      providerFromMap({
        'lead teep': [result('a', 'lead teep')],
        'jab teep': [result('b', 'jab teep')],
      }),
    ).searchQueries(['lead teep', 'jab teep']);

    assert.deepEqual(
      gathered.map((item) => item.externalId),
      ['a', 'b'],
    );
  });

  it('deduplicates repeated videos and merges query lineage', async () => {
    const gathered = await new ContentSearchService(
      providerFromMap({
        'lead teep': [result('abc123', 'lead teep', 'Lead Teep Setup')],
        'jab teep': [result('abc123', 'jab teep', 'Lead Teep Setup')],
      }),
    ).searchQueries(['lead teep', 'jab teep']);

    assert.equal(gathered.length, 1);
    assert.equal(gathered[0]?.externalId, 'abc123');
    assert.deepEqual(gathered[0]?.discoveredByQueries, [
      'lead teep',
      'jab teep',
    ]);
  });

  it('reports duplicate skipped counts after dedupe', async () => {
    const summary = await new ContentSearchService(
      providerFromMap({
        'lead teep': [result('abc123', 'lead teep', 'Lead Teep Setup')],
        'jab teep': [result('abc123', 'jab teep', 'Lead Teep Setup')],
      }),
    ).searchQueriesWithStats(['lead teep', 'jab teep']);

    assert.equal(summary.rawResultCount, 2);
    assert.equal(summary.deduplicatedResultCount, 1);
    assert.equal(summary.duplicateSkippedCount, 1);
  });

  it('returns unique normalized results', async () => {
    const gathered = await new ContentSearchService(
      providerFromMap({
        'lead teep': [
          result('abc123', 'lead teep', 'Lead Teep Setup'),
          result('def456', 'lead teep', 'Rear Teep'),
        ],
      }),
    ).searchQueries(['lead teep']);

    assert.equal(gathered.length, 2);
    assert.equal(gathered[0]?.provider, 'youtube');
    assert.equal(
      gathered[0]?.url,
      'https://www.youtube.com/watch?v=abc123',
    );
  });

  it('logs HTTP status and reason from a failed YouTube query', async () => {
    const warnings: Array<Record<string, unknown>> = [];
    await new ContentSearchService(
      providerFromMap({
        'lead teep': [result('a', 'lead teep')],
        broken: new ContentSearchError(
          'YouTube search failed (HTTP 500): reason=backendError',
          'provider',
          { status: 500, reason: 'backendError' },
        ),
      }),
      {
        info() {},
        warn(_message, fields) {
          if (fields) warnings.push(fields);
        },
        error() {},
      },
    ).searchQueries(['lead teep', 'broken']);

    assert.equal(warnings[0]?.status, 500);
    assert.equal(warnings[0]?.reason, 'backendError');
    assert.equal(warnings[0]?.query, 'broken');
  });

  it('keeps successful results when one query fails', async () => {
    const gathered = await new ContentSearchService(
      providerFromMap({
        'lead teep': [result('a', 'lead teep')],
        broken: new ContentSearchError('YouTube search failed', 'provider'),
        'jab teep': [result('b', 'jab teep')],
      }),
    ).searchQueries(['lead teep', 'broken', 'jab teep']);

    assert.deepEqual(
      gathered.map((item) => item.externalId),
      ['a', 'b'],
    );
  });

  it('fails when every query fails', async () => {
    await assert.rejects(
      () =>
        new ContentSearchService(
          providerFromMap({
            'lead teep': new ContentSearchError('YouTube search failed'),
            'jab teep': new ContentSearchError('YouTube search failed'),
          }),
        ).searchQueries(['lead teep', 'jab teep']),
      (error: unknown) =>
        error instanceof ContentSearchError &&
        error.message === 'YouTube search failed for all queries',
    );
  });

  it('fails fast when the YouTube API key is missing', async () => {
    const search = providerFromMap({
      'lead teep': new ContentSearchError(
        'YouTube API key is not configured',
        'configuration',
      ),
      'jab teep': [result('b', 'jab teep')],
    });

    await assert.rejects(
      () =>
        new ContentSearchService(search).searchQueries([
          'lead teep',
          'jab teep',
        ]),
      (error: unknown) =>
        error instanceof ContentSearchError && error.kind === 'configuration',
    );
    assert.deepEqual(search.searched, ['lead teep']);
  });

  it('fails fast when YouTube rate limit is exceeded', async () => {
    const search = providerFromMap({
      first: new ContentSearchError(
        'YouTube search failed (HTTP 429)',
        'rate_limit',
        { status: 429, reason: 'rateLimitExceeded' },
      ),
      second: [result('b', 'second')],
    });

    await assert.rejects(
      () => new ContentSearchService(search).searchQueries(['first', 'second']),
      (error: unknown) =>
        error instanceof ContentSearchError && error.kind === 'rate_limit',
    );
    assert.deepEqual(search.searched, ['first']);
  });
});
