export class UpdateCollectionCommand {
  constructor(
    public readonly userId: string,
    public readonly collectionId: string,
    public readonly patch: {
      name?: string;
      description?: string;
      braveContentTypes?: Array<'web' | 'news' | 'video' | 'image'>;
      sortOrder?: number;
    },
  ) {}
}
