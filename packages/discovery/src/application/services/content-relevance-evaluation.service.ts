import {
  contentRelevanceEvaluationBatchSchema,
  type ContentRelevanceEvaluation,
} from '../../domain/content-relevance-evaluation';
import type { RelevanceFilterConfig } from '../config/relevance-filter.config';
import { LlmGenerationError } from '../errors/llm-generation.error';
import type {
  ContentRelevanceEvaluator,
  EvaluateRelevanceInput,
  EvaluateRelevanceResult,
  RelevanceCandidate,
} from '../ports/content-relevance-evaluator.port';
import type { LlmProvider } from '../ports/llm-provider.port';
import {
  buildContentRelevanceUserPrompt,
  CONTENT_RELEVANCE_SYSTEM_PROMPT,
} from '../prompts/content-relevance.prompt';

export type RelevanceEvaluationLogger = {
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
};

const silentLogger: RelevanceEvaluationLogger = {
  info() {},
  warn() {},
  error() {},
};

export class ContentRelevanceEvaluationService
  implements ContentRelevanceEvaluator
{
  constructor(
    private readonly llmProvider: LlmProvider,
    private readonly config: RelevanceFilterConfig,
    private readonly logger: RelevanceEvaluationLogger = silentLogger,
  ) {}

  async evaluate(
    input: EvaluateRelevanceInput,
  ): Promise<EvaluateRelevanceResult> {
    const evaluations = new Map<string, ContentRelevanceEvaluation>();
    let failedEvaluationBatchCount = 0;
    const batches = chunk(input.candidates, this.config.batchSize);

    for (const [batchIndex, batch] of batches.entries()) {
      try {
        const batchEvaluations = await this.evaluateBatch(input, batch);
        if (batchEvaluations.length === 0) {
          throw new LlmGenerationError(
            'Relevance evaluation returned no evaluations',
          );
        }
        for (const evaluation of batchEvaluations) {
          if (
            batch.some(
              (candidate) => candidate.externalId === evaluation.externalId,
            )
          ) {
            evaluations.set(evaluation.externalId, evaluation);
          }
        }
      } catch (error) {
        failedEvaluationBatchCount += 1;
        this.logger.warn('relevance evaluation batch failed', {
          batchIndex,
          batchSize: batch.length,
          error:
            error instanceof Error
              ? error.message
              : 'Relevance evaluation failed',
        });
      }
    }

    if (
      input.candidates.length > 0 &&
      evaluations.size === 0 &&
      failedEvaluationBatchCount === batches.length
    ) {
      throw new LlmGenerationError(
        'Relevance evaluation failed for all batches',
      );
    }

    return {
      evaluations,
      evaluatedCount: evaluations.size,
      failedEvaluationBatchCount,
    };
  }

  private async evaluateBatch(
    input: EvaluateRelevanceInput,
    candidates: RelevanceCandidate[],
  ): Promise<ContentRelevanceEvaluation[]> {
    const generated = await this.llmProvider.generateStructured({
      systemPrompt: CONTENT_RELEVANCE_SYSTEM_PROMPT,
      userPrompt: buildContentRelevanceUserPrompt({
        spaceName: input.space.name,
        spaceDescription: input.space.description,
        collectionName: input.collection.name,
        collectionDescription: input.collection.description,
        candidates,
      }),
      schema: contentRelevanceEvaluationBatchSchema,
    });

    return contentRelevanceEvaluationBatchSchema.parse(generated.data)
      .evaluations;
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [];
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}
