import { Repository } from '../../../shared/domain/repository';
import { SourceSubscription } from './source-subscription.entity';

export const SOURCE_SUBSCRIPTION_REPOSITORY = Symbol(
  'SOURCE_SUBSCRIPTION_REPOSITORY',
);

export abstract class SourceSubscriptionRepository extends Repository<SourceSubscription> {
  abstract findByUserId(userId: string): Promise<SourceSubscription[]>;
  abstract findByUserAndSource(
    userId: string,
    sourceId: string,
  ): Promise<SourceSubscription | null>;
  abstract findActiveSourceIds(userId: string): Promise<string[]>;
}
