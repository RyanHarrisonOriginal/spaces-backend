export type ContentSearchErrorKind =
  | 'configuration'
  | 'provider'
  | 'rate_limit';

const RATE_LIMIT_REASONS = new Set([
  'rateLimitExceeded',
  'quotaExceeded',
  'dailyLimitExceeded',
  'userRateLimitExceeded',
]);

export class ContentSearchError extends Error {
  constructor(
    message: string,
    readonly kind: ContentSearchErrorKind = 'provider',
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ContentSearchError';
  }
}

export function isYoutubeRateLimit(details: {
  status?: unknown;
  reason?: unknown;
}): boolean {
  if (details.status === 429) {
    return true;
  }
  return (
    typeof details.reason === 'string' && RATE_LIMIT_REASONS.has(details.reason)
  );
}
