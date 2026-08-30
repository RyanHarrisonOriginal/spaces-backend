export interface GatherQueryProps {
  id: string;
  collectionId: string;
  query: string;
  createdAt: Date;
}

export class GatherQuery {
  private constructor(private readonly props: GatherQueryProps) {}

  static create(input: {
    id: string;
    collectionId: string;
    query: string;
    createdAt?: Date;
  }): GatherQuery {
    const query = input.query.trim();
    if (!query) throw new Error('Gather query text is required');

    return new GatherQuery({
      id: input.id,
      collectionId: input.collectionId,
      query,
      createdAt: input.createdAt ?? new Date(),
    });
  }

  static reconstitute(props: GatherQueryProps): GatherQuery {
    return new GatherQuery(props);
  }

  get id(): string {
    return this.props.id;
  }

  get collectionId(): string {
    return this.props.collectionId;
  }

  get query(): string {
    return this.props.query;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): GatherQueryProps {
    return { ...this.props };
  }
}
