import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

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
import { UpdateCollectionCommand } from '../update-collection.command';

@CommandHandler(UpdateCollectionCommand)
export class UpdateCollectionHandler
  implements ICommandHandler<UpdateCollectionCommand>
{
  constructor(
    @Inject(COLLECTION_REPOSITORY)
    private readonly collections: CollectionRepository,
    @Inject(SPACE_REPOSITORY)
    private readonly spaces: SpaceRepository,
  ) {}

  async execute(command: UpdateCollectionCommand): Promise<Collection> {
    const collection = await this.collections.findById(command.collectionId);
    if (!collection) {
      throw new NotFoundException('Collection', command.collectionId);
    }

    const space = await this.spaces.findById(collection.spaceId);
    if (!space || space.userId !== command.userId) {
      throw new NotFoundException('Collection', command.collectionId);
    }

    try {
      collection.update(command.patch);
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid collection update',
      );
    }

    return this.collections.save(collection);
  }
}
