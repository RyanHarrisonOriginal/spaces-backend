export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly displayName?: string,
    public readonly themeMode?: 'light' | 'dark',
  ) {}
}
