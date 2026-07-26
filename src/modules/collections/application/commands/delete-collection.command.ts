export class DeleteCollectionCommand {
  constructor(
    public readonly userId: string,
    public readonly collectionId: string,
  ) {}
}
