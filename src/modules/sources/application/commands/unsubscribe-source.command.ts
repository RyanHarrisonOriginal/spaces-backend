export class UnsubscribeSourceCommand {
  constructor(
    public readonly userId: string,
    public readonly sourceId: string,
  ) {}
}
