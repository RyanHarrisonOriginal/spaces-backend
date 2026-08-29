import { Inject, Injectable } from '@nestjs/common';

import { NotFoundException } from '../../../../shared/domain/exceptions';
import {
  SPACE_REPOSITORY,
  SpaceRepository,
} from '../../../spaces/domain/space.repository';
import { Collection } from '../../domain/collection.entity';
import {
  COLLECTION_REPOSITORY,
  CollectionRepository,
} from '../../domain/collection.repository';

@Injectable()
export class CollectionAccessService {
  constructor(
    @Inject(COLLECTION_REPOSITORY)
    private readonly collections: CollectionRepository,
    @Inject(SPACE_REPOSITORY)
    private readonly spaces: SpaceRepository,
  ) {}

  async requireOwnedCollection(
    userId: string,
    collectionId: string,
  ): Promise<Collection> {
    const collection = await this.collections.findById(collectionId);
    if (!collection) {
      throw new NotFoundException('Collection', collectionId);
    }

    const space = await this.spaces.findById(collection.spaceId);
    if (!space || space.userId !== userId) {
      throw new NotFoundException('Collection', collectionId);
    }

    return collection;
  }
}
