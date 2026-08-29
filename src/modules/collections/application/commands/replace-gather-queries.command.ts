export class ReplaceGatherQueriesCommand {
  constructor(
    public readonly userId: string,
    public readonly collectionId: string,
    public readonly queries: string[],
  ) {}
}
