export class ReplaceGatherQueriesCommand {
  constructor(
    public readonly userId: string,
    public readonly thingId: string,
    public readonly queries: string[],
  ) {}
}
