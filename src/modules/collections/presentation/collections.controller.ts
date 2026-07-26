import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { UserId } from '../../../shared/presentation/decorators/user-id.decorator';
import { CreateCollectionCommand } from '../application/commands/create-collection.command';
import { DeleteCollectionCommand } from '../application/commands/delete-collection.command';
import { UpdateCollectionCommand } from '../application/commands/update-collection.command';
import { CreateCollectionDto } from '../application/dto/create-collection.dto';
import { UpdateCollectionDto } from '../application/dto/update-collection.dto';
import { Collection } from '../domain/collection.entity';

@Controller()
export class CollectionsController {
  constructor(private readonly commandBus: CommandBus) {}

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
}
