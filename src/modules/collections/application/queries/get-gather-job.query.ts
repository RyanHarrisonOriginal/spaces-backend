export class GetGatherJobQuery {
  constructor(
    public readonly userId: string,
    public readonly collectionId: string,
    public readonly jobId: string,
  ) {}
}
