export type RelevanceFilterConfig = {
  minConfidence: number;
  batchSize: number;
};

const DEFAULT_MIN_CONFIDENCE = 0.7;
const DEFAULT_BATCH_SIZE = 10;

export function relevanceFilterConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): RelevanceFilterConfig {
  return {
    minConfidence: parseBoundedNumber(
      env.MIN_RELEVANCE_CONFIDENCE,
      DEFAULT_MIN_CONFIDENCE,
      0,
      1,
    ),
    batchSize: Math.round(
      parseBoundedNumber(
        env.RELEVANCE_EVALUATION_BATCH_SIZE,
        DEFAULT_BATCH_SIZE,
        1,
        50,
      ),
    ),
  };
}

function parseBoundedNumber(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}
