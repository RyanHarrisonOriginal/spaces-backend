export type ContentType = 'video' | 'article' | 'image';

export interface SourceProps {
  id: string;
  name: string;
  provider: string;
  description: string;
  priceCents: number;
  currency: string;
  billing: string;
  accent: string;
  isActive: boolean;
  unlocks: ContentType[];
  createdAt: Date;
  updatedAt: Date;
}

export class Source {
  private constructor(private readonly props: SourceProps) {}

  static reconstitute(props: SourceProps): Source {
    return new Source({ ...props, unlocks: [...props.unlocks] });
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get provider(): string {
    return this.props.provider;
  }

  get description(): string {
    return this.props.description;
  }

  get priceCents(): number {
    return this.props.priceCents;
  }

  get currency(): string {
    return this.props.currency;
  }

  get billing(): string {
    return this.props.billing;
  }

  get accent(): string {
    return this.props.accent;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get unlocks(): ContentType[] {
    return [...this.props.unlocks];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON() {
    return {
      ...this.props,
      unlocks: [...this.props.unlocks],
      priceLabel: `$${(this.props.priceCents / 100).toFixed(0)}`,
    };
  }
}
