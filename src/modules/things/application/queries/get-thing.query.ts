export class GetThingQuery {
  constructor(
    public readonly userId: string,
    public readonly thingId: string,
  ) {}
}
