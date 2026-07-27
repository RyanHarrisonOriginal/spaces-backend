export class SubscribeSourceCommand {
  constructor(
    public readonly userId: string,
    public readonly sourceId: string,
  ) {}
}
