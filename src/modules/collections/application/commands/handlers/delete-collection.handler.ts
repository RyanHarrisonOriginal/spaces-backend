
import { NotFoundException } from '../../../../../shared/domain/exceptions';
import {
  SpaceRepository,
} from '../../../../spaces/domain/space.repository';
import {
  CollectionRepository,
  CollectionSaveStrategy,
} from '../../../domain/collection.repository';
import { DeleteCollectionCommand } from '../delete-collection.command';

export class DeleteCollectionHandler {
  constructor(
    private readonly collectionRepo: CollectionRepository,
    private readonly spaceRepo: SpaceRepository,
  ) {}

  async execute(command: DeleteCollectionCommand): Promise<void> {
    const collection = await this.collectionRepo.get(command.collectionId);
    if (!collection) {
      throw new NotFoundException('Collection', command.collectionId);
    }

    const space = await this.spaceRepo.get(collection.spaceId);
    if (!space || space.userId !== command.userId) {
      throw new NotFoundException('Collection', command.collectionId);
    }

    await this.collectionRepo.save(collection, CollectionSaveStrategy.Delete);
  }
}
