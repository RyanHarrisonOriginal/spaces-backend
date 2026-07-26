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
import { CreateThingCommand } from '../application/commands/create-thing.command';
import { DeleteThingCommand } from '../application/commands/delete-thing.command';
import { ReplaceGatherQueriesCommand } from '../application/commands/replace-gather-queries.command';
import { UpdateThingCommand } from '../application/commands/update-thing.command';
import { CreateThingDto } from '../application/dto/create-thing.dto';
import { ReplaceGatherQueriesDto } from '../application/dto/replace-gather-queries.dto';
import { UpdateThingDto } from '../application/dto/update-thing.dto';
import { GetThingQuery } from '../application/queries/get-thing.query';
import { ListGatherQueriesQuery } from '../application/queries/list-gather-queries.query';
import { GatherQuery } from '../domain/gather-query.entity';
import { Thing } from '../domain/thing.entity';

@Controller()
export class ThingsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('collections/:collectionId/things')
  async create(
    @UserId() userId: string,
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Body() dto: CreateThingDto,
  ): Promise<Thing> {
    return this.commandBus.execute(
      new CreateThingCommand(
        userId,
        collectionId,
        dto.name,
        dto.description,
        dto.contentTypes,
        dto.sortOrder,
      ),
    );
  }

  @Get('things/:thingId')
  async getById(
    @UserId() userId: string,
    @Param('thingId', ParseUUIDPipe) thingId: string,
  ): Promise<Thing> {
    return this.queryBus.execute(new GetThingQuery(userId, thingId));
  }

  @Patch('things/:thingId')
  async update(
    @UserId() userId: string,
    @Param('thingId', ParseUUIDPipe) thingId: string,
    @Body() dto: UpdateThingDto,
  ): Promise<Thing> {
    return this.commandBus.execute(
      new UpdateThingCommand(userId, thingId, dto),
    );
  }

  @Delete('things/:thingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @UserId() userId: string,
    @Param('thingId', ParseUUIDPipe) thingId: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteThingCommand(userId, thingId));
  }

  @Get('things/:thingId/gather-queries')
  async listGatherQueries(
    @UserId() userId: string,
    @Param('thingId', ParseUUIDPipe) thingId: string,
  ): Promise<GatherQuery[]> {
    return this.queryBus.execute(new ListGatherQueriesQuery(userId, thingId));
  }

  @Put('things/:thingId/gather-queries')
  async replaceGatherQueries(
    @UserId() userId: string,
    @Param('thingId', ParseUUIDPipe) thingId: string,
    @Body() dto: ReplaceGatherQueriesDto,
  ): Promise<GatherQuery[]> {
    return this.commandBus.execute(
      new ReplaceGatherQueriesCommand(userId, thingId, dto.queries),
    );
  }
}
