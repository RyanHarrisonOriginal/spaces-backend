import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { ListSourcesHandler } from './application/queries/handlers/list-sources.handler';
import { SOURCE_REPOSITORY } from './domain/source.repository';
import { PrismaSourceRepository } from './infrastructure/prisma-source.repository';
import { SourcesController } from './presentation/sources.controller';

const QueryHandlers = [ListSourcesHandler];

@Module({
  imports: [CqrsModule],
  controllers: [SourcesController],
  providers: [
    ...QueryHandlers,
    { provide: SOURCE_REPOSITORY, useClass: PrismaSourceRepository },
  ],
  exports: [SOURCE_REPOSITORY],
})
export class SourcesModule {}
