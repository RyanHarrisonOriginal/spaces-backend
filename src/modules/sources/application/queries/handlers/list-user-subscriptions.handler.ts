import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SourceSubscription } from '../../../domain/source-subscription.entity';
import {
  SOURCE_SUBSCRIPTION_REPOSITORY,
  SourceSubscriptionRepository,
} from '../../../domain/source-subscription.repository';
import { ListUserSubscriptionsQuery } from '../list-user-subscriptions.query';

@QueryHandler(ListUserSubscriptionsQuery)
export class ListUserSubscriptionsHandler
  implements IQueryHandler<ListUserSubscriptionsQuery>
{
  constructor(
    @Inject(SOURCE_SUBSCRIPTION_REPOSITORY)
    private readonly subscriptions: SourceSubscriptionRepository,
  ) {}

  async execute(
    query: ListUserSubscriptionsQuery,
  ): Promise<SourceSubscription[]> {
    return this.subscriptions.findByUserId(query.userId);
  }
}
