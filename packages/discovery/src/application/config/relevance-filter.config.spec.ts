import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { relevanceFilterConfigFromEnv } from './relevance-filter.config';

describe('relevanceFilterConfigFromEnv', () => {
  it('defaults to 0.70 confidence and batch size 10', () => {
    const config = relevanceFilterConfigFromEnv({});
    assert.equal(config.minConfidence, 0.7);
    assert.equal(config.batchSize, 10);
  });

  it('reads MIN_RELEVANCE_CONFIDENCE from the environment', () => {
    const config = relevanceFilterConfigFromEnv({
      MIN_RELEVANCE_CONFIDENCE: '0.85',
    });
    assert.equal(config.minConfidence, 0.85);
  });

  it('ignores out-of-range confidence values', () => {
    const config = relevanceFilterConfigFromEnv({
      MIN_RELEVANCE_CONFIDENCE: '1.5',
    });
    assert.equal(config.minConfidence, 0.7);
  });
});
