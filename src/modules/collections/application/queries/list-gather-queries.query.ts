export class ListGatherQueriesQuery {
  constructor(
    public readonly userId: string,
    public readonly collectionId: string,
  ) {}
}
