
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
    private readonly collectionRepo: CollectionRepository,
    private readonly spaceRepo: SpaceRepository,
  ) {}

  async execute(command: UpdateCollectionCommand): Promise<Collection> {
    const collection = await this.collectionRepo.get(command.collectionId);
    if (!collection) {
      throw new NotFoundException('Collection', command.collectionId);
    }

    const space = await this.spaceRepo.get(collection.spaceId);
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

    return this.collectionRepo.save(collection);
  }
}
