export class UpdateSpaceCommand {
  constructor(
    public readonly userId: string,
    public readonly spaceId: string,
    public readonly patch: {
      name?: string;
      description?: string;
      accent?: string;
      headerFont?: string;
      bgColor?: string;
      textColor?: string;
      view?: 'card' | 'list';
    },
  ) {}
}
