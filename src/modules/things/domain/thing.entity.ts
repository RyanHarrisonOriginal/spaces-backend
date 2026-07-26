export type ContentType = 'video' | 'article' | 'image';
export type ThingStatus = 'idle' | 'fetching' | 'ready' | 'error';

export interface ThingProps {
  id: string;
  collectionId: string;
  name: string;
  description: string;
  status: ThingStatus;
  sortOrder: number;
  contentTypes: ContentType[];
  createdAt: Date;
  updatedAt: Date;
}

export class Thing {
  private constructor(private readonly props: ThingProps) {}

  static create(input: {
    id: string;
    collectionId: string;
    name: string;
    description: string;
    contentTypes: ContentType[];
    status?: ThingStatus;
    sortOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }): Thing {
    const now = new Date();
    const name = input.name.trim();
    const description = input.description.trim();
    if (!name) throw new Error('Thing name is required');
    if (!description) throw new Error('Thing description is required');
    if (!input.contentTypes.length) {
      throw new Error('At least one content type is required');
    }

    return new Thing({
      id: input.id,
      collectionId: input.collectionId,
      name,
      description,
      status: input.status ?? 'idle',
      sortOrder: input.sortOrder ?? 0,
      contentTypes: [...new Set(input.contentTypes)],
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }

  static reconstitute(props: ThingProps): Thing {
    return new Thing({
      ...props,
      contentTypes: [...props.contentTypes],
    });
  }

  get id(): string {
    return this.props.id;
  }

  get collectionId(): string {
    return this.props.collectionId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string {
    return this.props.description;
  }

  get status(): ThingStatus {
    return this.props.status;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get contentTypes(): ContentType[] {
    return [...this.props.contentTypes];
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
    status?: ThingStatus;
    sortOrder?: number;
    contentTypes?: ContentType[];
  }): void {
    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) throw new Error('Thing name is required');
      this.props.name = name;
    }
    if (patch.description !== undefined) {
      const description = patch.description.trim();
      if (!description) throw new Error('Thing description is required');
      this.props.description = description;
    }
    if (patch.status !== undefined) this.props.status = patch.status;
    if (patch.sortOrder !== undefined) this.props.sortOrder = patch.sortOrder;
    if (patch.contentTypes !== undefined) {
      if (!patch.contentTypes.length) {
        throw new Error('At least one content type is required');
      }
      this.props.contentTypes = [...new Set(patch.contentTypes)];
    }
    this.props.updatedAt = new Date();
  }

  toJSON(): ThingProps {
    return {
      ...this.props,
      contentTypes: [...this.props.contentTypes],
    };
  }
}
