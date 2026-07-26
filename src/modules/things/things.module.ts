import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { CollectionsModule } from '../collections/collections.module';
import { SpacesModule } from '../spaces/spaces.module';
import { CreateThingHandler } from './application/commands/handlers/create-thing.handler';
import { DeleteThingHandler } from './application/commands/handlers/delete-thing.handler';
import { ReplaceGatherQueriesHandler } from './application/commands/handlers/replace-gather-queries.handler';
import { UpdateThingHandler } from './application/commands/handlers/update-thing.handler';
import { GetThingHandler } from './application/queries/handlers/get-thing.handler';
import { ListGatherQueriesHandler } from './application/queries/handlers/list-gather-queries.handler';
import { ThingAccessService } from './application/services/thing-access.service';
import { GATHER_QUERY_REPOSITORY } from './domain/gather-query.repository';
import { THING_REPOSITORY } from './domain/thing.repository';
import { PrismaGatherQueryRepository } from './infrastructure/prisma-gather-query.repository';
import { PrismaThingRepository } from './infrastructure/prisma-thing.repository';
import { ThingsController } from './presentation/things.controller';

const CommandHandlers = [
  CreateThingHandler,
  UpdateThingHandler,
  DeleteThingHandler,
  ReplaceGatherQueriesHandler,
];
const QueryHandlers = [GetThingHandler, ListGatherQueriesHandler];

@Module({
  imports: [CqrsModule, SpacesModule, CollectionsModule],
  controllers: [ThingsController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ThingAccessService,
    {
      provide: THING_REPOSITORY,
      useClass: PrismaThingRepository,
    },
    {
      provide: GATHER_QUERY_REPOSITORY,
      useClass: PrismaGatherQueryRepository,
    },
  ],
  exports: [THING_REPOSITORY, GATHER_QUERY_REPOSITORY],
})
export class ThingsModule {}
