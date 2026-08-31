export const CONTENT_PROVIDERS = {
  youtube: 'youtube',
} as const;

export type ContentProviderName =
  (typeof CONTENT_PROVIDERS)[keyof typeof CONTENT_PROVIDERS];

export const CONTENT_ITEM_TYPES = {
  video: 'video',
  article: 'article',
  image: 'image',
} as const;

export type ContentItemType =
  (typeof CONTENT_ITEM_TYPES)[keyof typeof CONTENT_ITEM_TYPES];

export interface ContentItemProps {
  id: string;
  collectionId: string;
  provider: ContentProviderName;
  externalId: string;
  type: ContentItemType;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string | null;
  authorName: string | null;
  publishedAt: Date | null;
  discoveredByQueries: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ContentItem {
  private constructor(private readonly props: ContentItemProps) {}

  static create(input: {
    id: string;
    collectionId: string;
    provider: ContentProviderName;
    externalId: string;
    type?: ContentItemType;
    title: string;
    description?: string;
    url: string;
    thumbnailUrl?: string | null;
    authorName?: string | null;
    publishedAt?: Date | null;
    discoveredByQueries?: string[];
    sortOrder?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }): ContentItem {
    const externalId = input.externalId.trim();
    const url = input.url.trim();
    if (!externalId) throw new Error('Content item external id is required');
    if (!url) throw new Error('Content item url is required');

    const now = new Date();
    return new ContentItem({
      id: input.id,
      collectionId: input.collectionId,
      provider: input.provider,
      externalId,
      type: input.type ?? CONTENT_ITEM_TYPES.video,
      title: input.title.trim(),
      description: (input.description ?? '').trim(),
      url,
      thumbnailUrl: input.thumbnailUrl?.trim() || null,
      authorName: input.authorName?.trim() || null,
      publishedAt: input.publishedAt ?? null,
      discoveredByQueries: uniqueQueries(input.discoveredByQueries ?? []),
      sortOrder: input.sortOrder ?? 0,
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
    });
  }

  static reconstitute(props: ContentItemProps): ContentItem {
    return new ContentItem(props);
  }

  get id(): string {
    return this.props.id;
  }

  get collectionId(): string {
    return this.props.collectionId;
  }

  get provider(): ContentProviderName {
    return this.props.provider;
  }

  get externalId(): string {
    return this.props.externalId;
  }

  get type(): ContentItemType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get url(): string {
    return this.props.url;
  }

  get thumbnailUrl(): string | null {
    return this.props.thumbnailUrl;
  }

  get authorName(): string | null {
    return this.props.authorName;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  get discoveredByQueries(): string[] {
    return [...this.props.discoveredByQueries];
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

  toJSON(): ContentItemProps {
    return {
      ...this.props,
      discoveredByQueries: [...this.props.discoveredByQueries],
    };
  }
}

function uniqueQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const query of queries) {
    const trimmed = query.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}
