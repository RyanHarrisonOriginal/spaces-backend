export type ThemeMode = 'light' | 'dark';

export interface UserProps {
  id: string;
  email: string;
  displayName: string | null;
  themeMode: ThemeMode;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(input: {
    id: string;
    email: string;
    displayName?: string | null;
    themeMode?: ThemeMode;
    createdAt?: Date;
    updatedAt?: Date;
  }): User {
    const now = new Date();
    return new User({
      id: input.id,
      email: input.email.trim().toLowerCase(),
      displayName: input.displayName ?? null,
      themeMode: input.themeMode ?? 'light',
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }

  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get displayName(): string | null {
    return this.props.displayName;
  }

  get themeMode(): ThemeMode {
    return this.props.themeMode;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(patch: { displayName?: string | null; themeMode?: ThemeMode }): void {
    if (patch.displayName !== undefined) {
      this.props.displayName = patch.displayName;
    }
    if (patch.themeMode !== undefined) {
      this.props.themeMode = patch.themeMode;
    }
    this.props.updatedAt = new Date();
  }

  toJSON(): UserProps {
    return { ...this.props };
  }
}
