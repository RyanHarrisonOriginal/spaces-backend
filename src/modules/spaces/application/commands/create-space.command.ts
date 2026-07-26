export class CreateSpaceCommand {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly accent?: string,
    public readonly headerFont?: string,
    public readonly bgColor?: string,
    public readonly textColor?: string,
    public readonly view?: 'card' | 'list',
  ) {}
}
