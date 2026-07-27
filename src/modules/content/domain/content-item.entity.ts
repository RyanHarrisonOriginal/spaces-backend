export type ContentType = 'video' | 'article' | 'image';

export interface ContentItemProps {
  id: string;
  thingId: string;
  sourceId: string;
  type: ContentType;
  title: string;
  thumbnail: string;
  url: string | null;
  meta: string | null;
  sortOrder: number;
  createdAt: Date;
}

export class ContentItem {
  private constructor(private readonly props: ContentItemProps) {}

  static create(input: {
    id: string;
    thingId: string;
    sourceId: string;
    type: ContentType;
    title: string;
    thumbnail?: string;
    url?: string | null;
    meta?: string | null;
    sortOrder?: number;
    createdAt?: Date;
  }): ContentItem {
    const title = input.title.trim();
    if (!title) throw new Error('Content title is required');
    if (!input.sourceId) throw new Error('Content source is required');

    return new ContentItem({
      id: input.id,
      thingId: input.thingId,
      sourceId: input.sourceId,
      type: input.type,
      title,
      thumbnail: input.thumbnail ?? '',
      url: input.url ?? null,
      meta: input.meta ?? null,
      sortOrder: input.sortOrder ?? 0,
      createdAt: input.createdAt ?? new Date(),
    });
  }

  static reconstitute(props: ContentItemProps): ContentItem {
    return new ContentItem(props);
  }

  get id(): string {
    return this.props.id;
  }

  get thingId(): string {
    return this.props.thingId;
  }

  get sourceId(): string {
    return this.props.sourceId;
  }

  get type(): ContentType {
    return this.props.type;
  }

  get title(): string {
    return this.props.title;
  }

  get thumbnail(): string {
    return this.props.thumbnail;
  }

  get url(): string | null {
    return this.props.url;
  }

  get meta(): string | null {
    return this.props.meta;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): ContentItemProps {
    return { ...this.props };
  }
}
