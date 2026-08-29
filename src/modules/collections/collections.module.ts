import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SpacesModule } from '../spaces/spaces.module';
import { CreateCollectionHandler } from './application/commands/handlers/create-collection.handler';
import { DeleteCollectionHandler } from './application/commands/handlers/delete-collection.handler';
import { GatherCollectionHandler } from './application/commands/handlers/gather-collection.handler';
import { ReplaceGatherQueriesHandler } from './application/commands/handlers/replace-gather-queries.handler';
import { UpdateCollectionHandler } from './application/commands/handlers/update-collection.handler';
import { ListGatherQueriesHandler } from './application/queries/handlers/list-gather-queries.handler';
import { CollectionAccessService } from './application/services/collection-access.service';
import { COLLECTION_REPOSITORY } from './domain/collection.repository';
import { GATHER_QUERY_REPOSITORY } from './domain/gather-query.repository';
import { PrismaCollectionRepository } from './infrastructure/prisma-collection.repository';
import { PrismaGatherQueryRepository } from './infrastructure/prisma-gather-query.repository';
import { CollectionsController } from './presentation/collections.controller';

const CommandHandlers = [
  CreateCollectionHandler,
  UpdateCollectionHandler,
  DeleteCollectionHandler,
  ReplaceGatherQueriesHandler,
  GatherCollectionHandler,
];
const QueryHandlers = [ListGatherQueriesHandler];

@Module({
  imports: [CqrsModule, SpacesModule],
  controllers: [CollectionsController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    CollectionAccessService,
    {
      provide: COLLECTION_REPOSITORY,
      useClass: PrismaCollectionRepository,
    },
    {
      provide: GATHER_QUERY_REPOSITORY,
      useClass: PrismaGatherQueryRepository,
    },
  ],
  exports: [COLLECTION_REPOSITORY, CollectionAccessService],
})
export class CollectionsModule {}
