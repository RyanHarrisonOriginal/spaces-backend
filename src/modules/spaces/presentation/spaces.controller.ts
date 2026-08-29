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
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { UserId } from '../../../shared/presentation/decorators/user-id.decorator';
import { CreateSpaceCommand } from '../application/commands/create-space.command';
import { DeleteSpaceCommand } from '../application/commands/delete-space.command';
import { EnqueueSpaceDiscoveryProfileCommand } from '../application/commands/enqueue-space-discovery-profile.command';
import { UpdateSpaceCommand } from '../application/commands/update-space.command';
import { CreateSpaceDto } from '../application/dto/create-space.dto';
import { UpdateSpaceDto } from '../application/dto/update-space.dto';
import { GetSpaceTreeQuery } from '../application/queries/get-space-tree.query';
import { ListSpacesQuery } from '../application/queries/list-spaces.query';
import { Space } from '../domain/space.entity';

@Controller('spaces')
export class SpacesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  async list(@UserId() userId: string): Promise<Space[]> {
    return this.queryBus.execute(new ListSpacesQuery(userId));
  }

  @Post()
  async create(
    @UserId() userId: string,
    @Body() dto: CreateSpaceDto,
  ): Promise<Space> {
    return this.commandBus.execute(
      new CreateSpaceCommand(
        userId,
        dto.name,
        dto.description,
        dto.accent,
        dto.headerFont,
        dto.bgColor,
        dto.textColor,
        dto.view,
      ),
    );
  }

  @Post(':spaceId/discovery-profile')
  @HttpCode(HttpStatus.ACCEPTED)
  async enqueueDiscoveryProfile(
    @UserId() userId: string,
    @Param('spaceId', ParseUUIDPipe) spaceId: string,
  ): Promise<{ jobId: string }> {
    return this.commandBus.execute(
      new EnqueueSpaceDiscoveryProfileCommand(userId, spaceId),
    );
  }

  @Get(':spaceId')
  async getTree(
    @UserId() userId: string,
    @Param('spaceId', ParseUUIDPipe) spaceId: string,
  ) {
    return this.queryBus.execute(new GetSpaceTreeQuery(userId, spaceId));
  }

  @Patch(':spaceId')
  async update(
    @UserId() userId: string,
    @Param('spaceId', ParseUUIDPipe) spaceId: string,
    @Body() dto: UpdateSpaceDto,
  ): Promise<Space> {
    return this.commandBus.execute(
      new UpdateSpaceCommand(userId, spaceId, dto),
    );
  }

  @Delete(':spaceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @UserId() userId: string,
    @Param('spaceId', ParseUUIDPipe) spaceId: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteSpaceCommand(userId, spaceId));
  }
}
