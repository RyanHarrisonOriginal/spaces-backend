export class EnqueueSpaceDiscoveryProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly spaceId: string,
  ) {}
}
