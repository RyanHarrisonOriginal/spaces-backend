export class BootstrapUserCommand {
  constructor(
    public readonly email: string,
    public readonly displayName?: string,
    public readonly themeMode?: 'light' | 'dark',
  ) {}
}
