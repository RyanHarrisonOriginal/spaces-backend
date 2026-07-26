export interface CollectionProps {
  id: string;
  spaceId: string;
  name: string;
  description: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Collection {
  private constructor(private readonly props: CollectionProps) {}

  static create(input: {
    id: string;
    spaceId: string;
    name: string;
    description?: string;
    sortOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }): Collection {
    const now = new Date();
    const name = input.name.trim();
    if (!name) {
      throw new Error('Collection name is required');
    }

    return new Collection({
      id: input.id,
      spaceId: input.spaceId,
      name,
      description: (input.description ?? '').trim(),
      sortOrder: input.sortOrder ?? 0,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }

  static reconstitute(props: CollectionProps): Collection {
    return new Collection(props);
  }

  get id(): string {
    return this.props.id;
  }

  get spaceId(): string {
    return this.props.spaceId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  update(patch: {
    name?: string;
    description?: string;
    sortOrder?: number;
  }): void {
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) throw new Error('Collection name is required');
      this.props.name = name;
    }
    if (patch.description !== undefined) {
      this.props.description = patch.description.trim();
    }
    if (patch.sortOrder !== undefined) {
      this.props.sortOrder = patch.sortOrder;
    }
    this.props.updatedAt = new Date();
  }

  toJSON(): CollectionProps {
    return { ...this.props };
  }
}
