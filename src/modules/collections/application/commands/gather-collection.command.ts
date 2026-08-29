export class GatherCollectionCommand {
  constructor(
    public readonly userId: string,
    public readonly collectionId: string,
  ) {}
}
