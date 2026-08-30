export class ContentSearchError extends Error {
  constructor(
    message: string,
    readonly kind: 'configuration' | 'provider' = 'provider',
  ) {
    super(message);
    this.name = 'ContentSearchError';
  }
}
