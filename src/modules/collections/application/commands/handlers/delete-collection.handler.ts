import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { NotFoundException } from '../../../../../shared/domain/exceptions';
import {
  SPACE_REPOSITORY,
  SpaceRepository,
} from '../../../../spaces/domain/space.repository';
import {
  COLLECTION_REPOSITORY,
  CollectionRepository,
} from '../../../domain/collection.repository';
import { DeleteCollectionCommand } from '../delete-collection.command';

@CommandHandler(DeleteCollectionCommand)
export class DeleteCollectionHandler
  implements ICommandHandler<DeleteCollectionCommand>
{
  constructor(
    @Inject(COLLECTION_REPOSITORY)
    private readonly collections: CollectionRepository,
    @Inject(SPACE_REPOSITORY)
    private readonly spaces: SpaceRepository,
  ) {}

  async execute(command: DeleteCollectionCommand): Promise<void> {
    const collection = await this.collections.findById(command.collectionId);
    if (!collection) {
      throw new NotFoundException('Collection', command.collectionId);
    }

    const space = await this.spaces.findById(collection.spaceId);
    if (!space || space.userId !== command.userId) {
      throw new NotFoundException('Collection', command.collectionId);
    }

    await this.collections.delete(command.collectionId);
  }
}
