export type SpaceView = 'card' | 'list';

export interface SpaceProps {
  id: string;
  userId: string;
  name: string;
  description: string;
  accent: string;
  headerFont: string;
  bgColor: string;
  textColor: string;
  view: SpaceView;
  createdAt: Date;
  updatedAt: Date;
}

export class Space {
  private constructor(private readonly props: SpaceProps) {}

  static create(input: {
    id: string;
    userId: string;
    name: string;
    description?: string;
    accent?: string;
    headerFont?: string;
    bgColor?: string;
    textColor?: string;
    view?: SpaceView;
    createdAt?: Date;
    updatedAt?: Date;
  }): Space {
    const now = new Date();
    const name = input.name.trim();
    if (!name) {
      throw new Error('Space name is required');
    }

    return new Space({
      id: input.id,
      userId: input.userId,
      name,
      description: (input.description ?? '').trim(),
      accent: input.accent ?? 'ink',
      headerFont: input.headerFont ?? 'SpaceGrotesk',
      bgColor: input.bgColor ?? '',
      textColor: input.textColor ?? '',
      view: input.view ?? 'card',
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }

  static reconstitute(props: SpaceProps): Space {
    return new Space(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get accent(): string {
    return this.props.accent;
  }

  get headerFont(): string {
    return this.props.headerFont;
  }

  get bgColor(): string {
    return this.props.bgColor;
  }

  get textColor(): string {
    return this.props.textColor;
  }

  get view(): SpaceView {
    return this.props.view;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  assertOwnedBy(userId: string): void {
    if (this.props.userId !== userId) {
      throw new Error('Space not owned by user');
    }
  }

  update(patch: {
    name?: string;
    description?: string;
    accent?: string;
    headerFont?: string;
    bgColor?: string;
    textColor?: string;
    view?: SpaceView;
  }): void {
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) throw new Error('Space name is required');
      this.props.name = name;
    }
    if (patch.description !== undefined) {
      this.props.description = patch.description.trim();
    }
    if (patch.accent !== undefined) this.props.accent = patch.accent;
    if (patch.headerFont !== undefined) this.props.headerFont = patch.headerFont;
    if (patch.bgColor !== undefined) this.props.bgColor = patch.bgColor;
    if (patch.textColor !== undefined) this.props.textColor = patch.textColor;
    if (patch.view !== undefined) this.props.view = patch.view;
    this.props.updatedAt = new Date();
  }

  toJSON(): SpaceProps {
    return { ...this.props };
  }
}
