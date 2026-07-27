export class GatherThingCommand {
  constructor(
    public readonly userId: string,
    public readonly thingId: string,
  ) {}
}
