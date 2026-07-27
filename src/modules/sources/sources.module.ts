import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { UsersModule } from '../users/users.module';
import { SubscribeSourceHandler } from './application/commands/handlers/subscribe-source.handler';
import { UnsubscribeSourceHandler } from './application/commands/handlers/unsubscribe-source.handler';
import { ListSourcesHandler } from './application/queries/handlers/list-sources.handler';
import { ListUserSubscriptionsHandler } from './application/queries/handlers/list-user-subscriptions.handler';
import { SOURCE_SUBSCRIPTION_REPOSITORY } from './domain/source-subscription.repository';
import { SOURCE_REPOSITORY } from './domain/source.repository';
import { PrismaSourceSubscriptionRepository } from './infrastructure/prisma-source-subscription.repository';
import { PrismaSourceRepository } from './infrastructure/prisma-source.repository';
import { SourcesController } from './presentation/sources.controller';

const CommandHandlers = [SubscribeSourceHandler, UnsubscribeSourceHandler];
const QueryHandlers = [ListSourcesHandler, ListUserSubscriptionsHandler];

@Module({
  imports: [CqrsModule, UsersModule],
  controllers: [SourcesController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    { provide: SOURCE_REPOSITORY, useClass: PrismaSourceRepository },
    {
      provide: SOURCE_SUBSCRIPTION_REPOSITORY,
      useClass: PrismaSourceSubscriptionRepository,
    },
  ],
  exports: [SOURCE_REPOSITORY, SOURCE_SUBSCRIPTION_REPOSITORY],
})
export class SourcesModule {}
