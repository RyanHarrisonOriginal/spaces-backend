
import {
  NotFoundException,
  ValidationException,
} from '../../../../../shared/domain/exceptions';
import {
  SpaceRepository,
} from '../../../../spaces/domain/space.repository';
import { Collection } from '../../../domain/collection.entity';
import {
  CollectionRepository,
} from '../../../domain/collection.repository';
import { UpdateCollectionCommand } from '../update-collection.command';

export class UpdateCollectionHandler {
  constructor(
    private readonly collections: CollectionRepository,
    private readonly spaces: SpaceRepository,
  ) {}

  async execute(command: UpdateCollectionCommand): Promise<Collection> {
    const collection = await this.collections.get(command.collectionId);
    if (!collection) {
      throw new NotFoundException('Collection', command.collectionId);
    }

    const space = await this.spaces.get(collection.spaceId);
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
