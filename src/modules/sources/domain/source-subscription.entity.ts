export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing';

export interface SourceSubscriptionProps {
  id: string;
  userId: string;
  sourceId: string;
  status: SubscriptionStatus;
  externalRef: string | null;
  startedAt: Date;
  canceledAt: Date | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SourceSubscription {
  private constructor(private readonly props: SourceSubscriptionProps) {}

  static create(input: {
    id: string;
    userId: string;
    sourceId: string;
    status?: SubscriptionStatus;
  }): SourceSubscription {
    const now = new Date();
    return new SourceSubscription({
      id: input.id,
      userId: input.userId,
      sourceId: input.sourceId,
      status: input.status ?? 'active',
      externalRef: null,
      startedAt: now,
      canceledAt: null,
      currentPeriodEnd: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: SourceSubscriptionProps): SourceSubscription {
    return new SourceSubscription(props);
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get sourceId(): string {
    return this.props.sourceId;
  }

  get status(): SubscriptionStatus {
    return this.props.status;
  }

  get externalRef(): string | null {
    return this.props.externalRef;
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get canceledAt(): Date | null {
    return this.props.canceledAt;
  }

  get currentPeriodEnd(): Date | null {
    return this.props.currentPeriodEnd;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  activate(): void {
    this.props.status = 'active';
    this.props.canceledAt = null;
    this.props.updatedAt = new Date();
  }

  cancel(): void {
    this.props.status = 'canceled';
    this.props.canceledAt = new Date();
    this.props.updatedAt = new Date();
  }

  toJSON(): SourceSubscriptionProps {
    return { ...this.props };
  }
}
