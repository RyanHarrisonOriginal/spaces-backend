export class UpdateCollectionCommand {
  constructor(
    public readonly userId: string,
    public readonly collectionId: string,
    public readonly patch: {
      name?: string;
      description?: string;
      sortOrder?: number;
    },
  ) {}
}
