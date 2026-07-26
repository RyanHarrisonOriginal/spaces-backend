export class DeleteSpaceCommand {
  constructor(
    public readonly userId: string,
    public readonly spaceId: string,
  ) {}
}
