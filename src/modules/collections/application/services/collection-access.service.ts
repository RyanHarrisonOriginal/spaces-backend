import { NotFoundException } from '../../../../shared/domain/exceptions';
import {
  SpaceRepository,
} from '../../../spaces/domain/space.repository';
import { Collection } from '../../domain/collection.entity';
import {
  CollectionRepository,
} from '../../domain/collection.repository';

export class CollectionAccessService {
  constructor(
    private readonly collectionRepo: CollectionRepository,
    private readonly spaceRepo: SpaceRepository,
  ) {}

  async requireOwnedCollection(
    userId: string,
    collectionId: string,
  ): Promise<Collection> {
    const collection = await this.collectionRepo.get(collectionId);
    if (!collection) {
      throw new NotFoundException('Collection', collectionId);
    }

    const space = await this.spaceRepo.get(collection.spaceId);
    if (!space || space.userId !== userId) {
      throw new NotFoundException('Collection', collectionId);
    }

    return collection;
  }
}
