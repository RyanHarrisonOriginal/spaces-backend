import { z } from 'zod';

export const contentRelevanceEvaluationSchema = z.object({
  externalId: z.string().min(1),
  relevant: z.boolean(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});

export const contentRelevanceEvaluationBatchSchema = z.object({
  evaluations: z.array(contentRelevanceEvaluationSchema),
});

export type ContentRelevanceEvaluation = z.infer<
  typeof contentRelevanceEvaluationSchema
>;

export type ContentRelevanceEvaluationBatch = z.infer<
  typeof contentRelevanceEvaluationBatchSchema
>;
