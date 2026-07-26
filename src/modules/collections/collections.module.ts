import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { SpacesModule } from '../spaces/spaces.module';
import { CreateCollectionHandler } from './application/commands/handlers/create-collection.handler';
import { DeleteCollectionHandler } from './application/commands/handlers/delete-collection.handler';
import { UpdateCollectionHandler } from './application/commands/handlers/update-collection.handler';
import { COLLECTION_REPOSITORY } from './domain/collection.repository';
import { PrismaCollectionRepository } from './infrastructure/prisma-collection.repository';
import { CollectionsController } from './presentation/collections.controller';

const CommandHandlers = [
  CreateCollectionHandler,
  UpdateCollectionHandler,
  DeleteCollectionHandler,
];

@Module({
  imports: [CqrsModule, SpacesModule],
  controllers: [CollectionsController],
  providers: [
    ...CommandHandlers,
    {
      provide: COLLECTION_REPOSITORY,
      useClass: PrismaCollectionRepository,
    },
  ],
  exports: [COLLECTION_REPOSITORY],
})
export class CollectionsModule {}
