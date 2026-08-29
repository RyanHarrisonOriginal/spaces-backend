export class ListContentItemsQuery {
  constructor(
    public readonly userId: string,
    public readonly collectionId: string,
  ) {}
}
