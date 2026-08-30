export class EnqueueCollectionDiscoveryProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly collectionId: string,
  ) {}
}
