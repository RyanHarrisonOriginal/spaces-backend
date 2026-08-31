import type { ContentRelevanceEvaluation } from '../../domain/content-relevance-evaluation';

export function isProvenRelevant(
  evaluation: ContentRelevanceEvaluation | undefined,
  minConfidence: number,
): boolean {
  return (
    evaluation !== undefined &&
    evaluation.relevant === true &&
    evaluation.confidence >= minConfidence
  );
}

export function selectAcceptedCandidates<T extends { externalId: string }>(
  candidates: T[],
  evaluations: ReadonlyMap<string, ContentRelevanceEvaluation>,
  minConfidence: number,
): T[] {
  return candidates.filter((candidate) =>
    isProvenRelevant(evaluations.get(candidate.externalId), minConfidence),
  );
}
