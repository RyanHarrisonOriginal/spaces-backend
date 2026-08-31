import type { ContentRelevanceEvaluation } from '../../domain/content-relevance-evaluation';

export type RelevanceCandidate = {
  externalId: string;
  title: string;
  description: string;
  discoveredByQueries: string[];
};

export type EvaluateRelevanceInput = {
  space: { name: string; description: string };
  collection: { name: string; description: string };
  candidates: RelevanceCandidate[];
};

export type EvaluateRelevanceResult = {
  evaluations: Map<string, ContentRelevanceEvaluation>;
  evaluatedCount: number;
  failedEvaluationBatchCount: number;
};

export interface ContentRelevanceEvaluator {
  evaluate(input: EvaluateRelevanceInput): Promise<EvaluateRelevanceResult>;
}
