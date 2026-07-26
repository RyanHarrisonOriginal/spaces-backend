import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';

import {
  NotFoundException,
  ValidationException,
} from '../../../../../shared/domain/exceptions';
import {
  SPACE_REPOSITORY,
  SpaceRepository,
} from '../../../../spaces/domain/space.repository';
import { Collection } from '../../../domain/collection.entity';
import {
  COLLECTION_REPOSITORY,
  CollectionRepository,
} from '../../../domain/collection.repository';
import { CreateCollectionCommand } from '../create-collection.command';

@CommandHandler(CreateCollectionCommand)
export class CreateCollectionHandler
  implements ICommandHandler<CreateCollectionCommand>
{
  constructor(
    @Inject(COLLECTION_REPOSITORY)
    private readonly collections: CollectionRepository,
    @Inject(SPACE_REPOSITORY)
    private readonly spaces: SpaceRepository,
  ) {}

  async execute(command: CreateCollectionCommand): Promise<Collection> {
    const space = await this.spaces.findById(command.spaceId);
    if (!space || space.userId !== command.userId) {
      throw new NotFoundException('Space', command.spaceId);
    }

    try {
      const collection = Collection.create({
        id: randomUUID(),
        spaceId: command.spaceId,
        name: command.name,
        description: command.description,
        sortOrder: command.sortOrder,
      });
      return this.collections.save(collection);
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid collection',
      );
    }
  }
}
