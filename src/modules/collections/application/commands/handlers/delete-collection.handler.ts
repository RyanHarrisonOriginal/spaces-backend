
import { NotFoundException } from '../../../../../shared/domain/exceptions';
import {
  SpaceRepository,
} from '../../../../spaces/domain/space.repository';
import {
  CollectionRepository,
  CollectionSave,
} from '../../../domain/collection.repository';
import { DeleteCollectionCommand } from '../delete-collection.command';

export class DeleteCollectionHandler {
  constructor(
    private readonly collections: CollectionRepository,
    private readonly spaces: SpaceRepository,
  ) {}

  async execute(command: DeleteCollectionCommand): Promise<void> {
    const collection = await this.collections.get(command.collectionId);
    if (!collection) {
      throw new NotFoundException('Collection', command.collectionId);
    }

    const space = await this.spaces.get(collection.spaceId);
    if (!space || space.userId !== command.userId) {
      throw new NotFoundException('Collection', command.collectionId);
    }

    await this.collections.save(collection, CollectionSave.Delete);
  }
}
