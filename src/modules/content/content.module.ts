import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ThingsModule } from '../things/things.module';
import { ReplaceContentItemsHandler } from './application/commands/handlers/replace-content-items.handler';
import { ListContentItemsHandler } from './application/queries/handlers/list-content-items.handler';
import { CONTENT_ITEM_REPOSITORY } from './domain/content-item.repository';
import { PrismaContentItemRepository } from './infrastructure/prisma-content-item.repository';
import { ContentController } from './presentation/content.controller';

@Module({
  imports: [CqrsModule, ThingsModule],
  controllers: [ContentController],
  providers: [
    ReplaceContentItemsHandler,
    ListContentItemsHandler,
    {
      provide: CONTENT_ITEM_REPOSITORY,
      useClass: PrismaContentItemRepository,
    },
  ],
  exports: [CONTENT_ITEM_REPOSITORY],
})
export class ContentModule {}
