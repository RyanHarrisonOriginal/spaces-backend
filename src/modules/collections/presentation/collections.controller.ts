import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { UserId } from '../../../shared/presentation/decorators/user-id.decorator';
import { CreateCollectionCommand } from '../application/commands/create-collection.command';
import { DeleteCollectionCommand } from '../application/commands/delete-collection.command';
import { GatherCollectionCommand } from '../application/commands/gather-collection.command';
import { ReplaceGatherQueriesCommand } from '../application/commands/replace-gather-queries.command';
import { UpdateCollectionCommand } from '../application/commands/update-collection.command';
import { CreateCollectionDto } from '../application/dto/create-collection.dto';
import { ReplaceGatherQueriesDto } from '../application/dto/replace-gather-queries.dto';
import { UpdateCollectionDto } from '../application/dto/update-collection.dto';
import { ListGatherQueriesQuery } from '../application/queries/list-gather-queries.query';
import { Collection } from '../domain/collection.entity';
import { GatherQuery } from '../domain/gather-query.entity';

@Controller()
export class CollectionsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('spaces/:spaceId/collections')
  async create(
    @UserId() userId: string,
    @Param('spaceId', ParseUUIDPipe) spaceId: string,
    @Body() dto: CreateCollectionDto,
  ): Promise<Collection> {
    return this.commandBus.execute(
      new CreateCollectionCommand(
        userId,
        spaceId,
        dto.name,
        dto.description,
        dto.sortOrder,
      ),
    );
  }

  @Patch('collections/:collectionId')
  async update(
    @UserId() userId: string,
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Body() dto: UpdateCollectionDto,
  ): Promise<Collection> {
    return this.commandBus.execute(
      new UpdateCollectionCommand(userId, collectionId, dto),
    );
  }

  @Delete('collections/:collectionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @UserId() userId: string,
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new DeleteCollectionCommand(userId, collectionId),
    );
  }

  @Get('collections/:collectionId/gather-queries')
  async listGatherQueries(
    @UserId() userId: string,
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
  ): Promise<GatherQuery[]> {
    return this.queryBus.execute(
      new ListGatherQueriesQuery(userId, collectionId),
    );
  }

  @Put('collections/:collectionId/gather-queries')
  async replaceGatherQueries(
    @UserId() userId: string,
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Body() dto: ReplaceGatherQueriesDto,
  ): Promise<GatherQuery[]> {
    return this.commandBus.execute(
      new ReplaceGatherQueriesCommand(userId, collectionId, dto.queries),
    );
  }

  @Post('collections/:collectionId/gather')
  async gather(
    @UserId() userId: string,
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
  ) {
    return this.commandBus.execute(
      new GatherCollectionCommand(userId, collectionId),
    );
  }
}
