export const GATHER_SOURCES = {
  youtube: 'youtube',
  brave: 'brave',
} as const;

export type GatherSourceName =
  (typeof GATHER_SOURCES)[keyof typeof GATHER_SOURCES];

export const BRAVE_CONTENT_TYPES = {
  web: 'web',
  news: 'news',
  video: 'video',
  image: 'image',
} as const;

export type BraveContentTypeName =
  (typeof BRAVE_CONTENT_TYPES)[keyof typeof BRAVE_CONTENT_TYPES];

export const DEFAULT_BRAVE_CONTENT_TYPES: BraveContentTypeName[] = [
  BRAVE_CONTENT_TYPES.web,
];

export interface CollectionProps {
  id: string;
  spaceId: string;
  name: string;
  description: string;
  gatherSource: GatherSourceName;
  braveContentTypes: BraveContentTypeName[];
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
    braveContentTypes?: BraveContentTypeName[];
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
      gatherSource: GATHER_SOURCES.brave,
      braveContentTypes: normalizeBraveContentTypes(input.braveContentTypes),
      sortOrder: input.sortOrder ?? 0,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }

  static reconstitute(props: CollectionProps): Collection {
    return new Collection({
      ...props,
      braveContentTypes: normalizeBraveContentTypes(props.braveContentTypes),
    });
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

  get gatherSource(): GatherSourceName {
    return this.props.gatherSource;
  }

  get braveContentTypes(): BraveContentTypeName[] {
    return [...this.props.braveContentTypes];
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
    braveContentTypes?: BraveContentTypeName[];
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
    if (patch.braveContentTypes !== undefined) {
      this.props.braveContentTypes = normalizeBraveContentTypes(
        patch.braveContentTypes,
      );
    }
    if (patch.sortOrder !== undefined) {
      this.props.sortOrder = patch.sortOrder;
    }
    this.props.updatedAt = new Date();
  }

  toJSON(): CollectionProps {
    return {
      ...this.props,
      braveContentTypes: [...this.props.braveContentTypes],
    };
  }
}

export function isBraveContentType(
  value: string,
): value is BraveContentTypeName {
  return (
    value === BRAVE_CONTENT_TYPES.web ||
    value === BRAVE_CONTENT_TYPES.news ||
    value === BRAVE_CONTENT_TYPES.video ||
    value === BRAVE_CONTENT_TYPES.image
  );
}

export function normalizeBraveContentTypes(
  values?: readonly string[] | null,
): BraveContentTypeName[] {
  const unique: BraveContentTypeName[] = [];
  for (const value of values ?? []) {
    if (!isBraveContentType(value)) continue;
    if (unique.includes(value)) continue;
    unique.push(value);
  }
  return unique.length > 0 ? unique : [...DEFAULT_BRAVE_CONTENT_TYPES];
}
