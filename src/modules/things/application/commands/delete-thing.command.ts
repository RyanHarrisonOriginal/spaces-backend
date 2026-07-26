export class DeleteThingCommand {
  constructor(
    public readonly userId: string,
    public readonly thingId: string,
  ) {}
}
