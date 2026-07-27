import { Body, Controller, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { UserId } from '../../../shared/presentation/decorators/user-id.decorator';
import { ReplaceContentItemsCommand } from '../application/commands/replace-content-items.command';
import { ReplaceContentItemsDto } from '../application/dto/replace-content-items.dto';
import { ListContentItemsQuery } from '../application/queries/list-content-items.query';
import { ContentItem } from '../domain/content-item.entity';

@Controller('things/:thingId/content')
export class ContentController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async list(
    @UserId() userId: string,
    @Param('thingId', ParseUUIDPipe) thingId: string,
  ): Promise<ContentItem[]> {
    return this.queryBus.execute(new ListContentItemsQuery(userId, thingId));
  }

  @Put()
  async replace(
    @UserId() userId: string,
    @Param('thingId', ParseUUIDPipe) thingId: string,
    @Body() dto: ReplaceContentItemsDto,
  ): Promise<ContentItem[]> {
    return this.commandBus.execute(
      new ReplaceContentItemsCommand(userId, thingId, dto.items),
    );
  }
}
