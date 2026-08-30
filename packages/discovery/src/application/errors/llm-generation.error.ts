export class LlmGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmGenerationError';
  }
}

export class CollectionNotFoundError extends Error {
  constructor(collectionId: string) {
    super(`Collection '${collectionId}' not found`);
    this.name = 'CollectionNotFoundError';
  }
}
