import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ContentRelevanceEvaluation } from '../../domain/content-relevance-evaluation';
import { LlmGenerationError } from '../errors/llm-generation.error';
import type { LlmProvider } from '../ports/llm-provider.port';
import type {
  EvaluateRelevanceInput,
  RelevanceCandidate,
} from '../ports/content-relevance-evaluator.port';
import { ContentRelevanceEvaluationService } from './content-relevance-evaluation.service';
import { selectAcceptedCandidates } from './select-accepted-candidates';

const goal: EvaluateRelevanceInput = {
  space: {
    name: 'Muay Thai',
    description: 'Intermediate southpaw striking.',
  },
  collection: {
    name: 'Jab teep',
    description: 'Using the jab and teep together offensively.',
  },
  candidates: [],
};

function candidate(
  externalId: string,
  title = externalId,
): RelevanceCandidate {
  return {
    externalId,
    title,
    description: `${title} description`,
    discoveredByQueries: ['jab teep'],
  };
}

function evaluation(
  externalId: string,
  relevant: boolean,
  confidence: number,
): ContentRelevanceEvaluation {
  return {
    externalId,
    relevant,
    confidence,
    reason: relevant ? 'matches collection goal' : 'too broad',
  };
}

function fakeLlmSequence(responses: unknown[]): LlmProvider {
  let index = 0;
  return {
    async generateStructured<T>() {
      const next = responses[index++];
      if (next instanceof Error) {
        throw next;
      }
      return {
        data: next as T,
        provider: 'test',
        model: 'fake-model',
      };
    },
  };
}

describe('ContentRelevanceEvaluationService', () => {
  it('evaluates candidates in batches', async () => {
    const llm = fakeLlmSequence([
      { evaluations: [evaluation('a', true, 0.9)] },
      { evaluations: [evaluation('b', false, 0.95)] },
    ]);
    const service = new ContentRelevanceEvaluationService(llm, {
      minConfidence: 0.7,
      batchSize: 1,
    });

    const result = await service.evaluate({
      ...goal,
      candidates: [candidate('a'), candidate('b')],
    });

    assert.equal(result.evaluatedCount, 2);
    assert.equal(result.failedEvaluationBatchCount, 0);
    assert.equal(result.evaluations.get('a')?.relevant, true);
    assert.equal(result.evaluations.get('b')?.relevant, false);
  });

  it('does not record evaluations from a failed batch', async () => {
    const llm = fakeLlmSequence([
      { evaluations: [evaluation('a', true, 0.95), evaluation('b', true, 0.9)] },
      new LlmGenerationError('provider down'),
    ]);
    const service = new ContentRelevanceEvaluationService(llm, {
      minConfidence: 0.7,
      batchSize: 2,
    });

    const result = await service.evaluate({
      ...goal,
      candidates: [
        candidate('a'),
        candidate('b'),
        candidate('c'),
        candidate('d'),
      ],
    });

    assert.equal(result.failedEvaluationBatchCount, 1);
    assert.equal(result.evaluatedCount, 2);
    assert.equal(result.evaluations.has('a'), true);
    assert.equal(result.evaluations.has('c'), false);
    assert.equal(result.evaluations.has('d'), false);
  });

  it('fails closed when every evaluation batch fails', async () => {
    const service = new ContentRelevanceEvaluationService(
      fakeLlmSequence([
        new LlmGenerationError('batch 1'),
        new LlmGenerationError('batch 2'),
      ]),
      { minConfidence: 0.7, batchSize: 1 },
    );

    await assert.rejects(
      () =>
        service.evaluate({
          ...goal,
          candidates: [candidate('a'), candidate('b')],
        }),
      (error: unknown) =>
        error instanceof LlmGenerationError &&
        error.message === 'Relevance evaluation failed for all batches',
    );
  });

  it('ignores evaluations for unknown external ids', async () => {
    const service = new ContentRelevanceEvaluationService(
      fakeLlmSequence([
        {
          evaluations: [
            evaluation('a', true, 0.9),
            evaluation('unknown', true, 0.99),
          ],
        },
      ]),
      { minConfidence: 0.7, batchSize: 10 },
    );

    const result = await service.evaluate({
      ...goal,
      candidates: [candidate('a')],
    });

    assert.equal(result.evaluations.has('unknown'), false);
    assert.equal(result.evaluations.has('a'), true);
  });
});

describe('selectAcceptedCandidates', () => {
  const items = [candidate('keep'), candidate('reject'), candidate('low'), candidate('missing')];

  it('keeps only relevant high-confidence evaluations', () => {
    const evaluations = new Map<string, ContentRelevanceEvaluation>([
      ['keep', evaluation('keep', true, 0.9)],
      ['reject', evaluation('reject', false, 0.99)],
      ['low', evaluation('low', true, 0.4)],
    ]);

    const accepted = selectAcceptedCandidates(items, evaluations, 0.7);
    assert.deepEqual(
      accepted.map((item) => item.externalId),
      ['keep'],
    );
  });

  it('rejects missing evaluations', () => {
    const accepted = selectAcceptedCandidates(
      [candidate('missing')],
      new Map(),
      0.7,
    );
    assert.deepEqual(accepted, []);
  });

  it('rejects low-confidence relevant videos', () => {
    const accepted = selectAcceptedCandidates(
      [candidate('low')],
      new Map([['low', evaluation('low', true, 0.69)]]),
      0.7,
    );
    assert.deepEqual(accepted, []);
  });
});
