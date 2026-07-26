export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly displayName?: string | null,
    public readonly themeMode?: 'light' | 'dark',
  ) {}
}
