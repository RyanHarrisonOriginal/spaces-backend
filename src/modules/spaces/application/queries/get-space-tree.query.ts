export class GetSpaceTreeQuery {
  constructor(
    public readonly userId: string,
    public readonly spaceId: string,
  ) {}
}
