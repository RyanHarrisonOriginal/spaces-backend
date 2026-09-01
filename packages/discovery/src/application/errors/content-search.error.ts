export type ContentSearchErrorKind =
  | 'configuration'
  | 'provider'
  | 'rate_limit';

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

export function isSearchRateLimit(details: { status?: unknown }): boolean {
  return details.status === 429;
}
