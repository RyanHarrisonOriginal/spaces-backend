import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { UsersModule } from '../users/users.module';
import { CreateSpaceHandler } from './application/commands/handlers/create-space.handler';
import { DeleteSpaceHandler } from './application/commands/handlers/delete-space.handler';
import { UpdateSpaceHandler } from './application/commands/handlers/update-space.handler';
import { GetSpaceTreeHandler } from './application/queries/handlers/get-space-tree.handler';
import { ListSpacesHandler } from './application/queries/handlers/list-spaces.handler';
import { SPACE_REPOSITORY } from './domain/space.repository';
import { PrismaSpaceRepository } from './infrastructure/prisma-space.repository';
import { SpacesController } from './presentation/spaces.controller';

const CommandHandlers = [
  CreateSpaceHandler,
  UpdateSpaceHandler,
  DeleteSpaceHandler,
];
const QueryHandlers = [ListSpacesHandler, GetSpaceTreeHandler];

@Module({
  imports: [CqrsModule, UsersModule],
  controllers: [SpacesController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: SPACE_REPOSITORY,
      useClass: PrismaSpaceRepository,
    },
  ],
  exports: [SPACE_REPOSITORY],
})
export class SpacesModule {}
