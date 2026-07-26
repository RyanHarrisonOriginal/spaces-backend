import { Inject, Injectable } from '@nestjs/common';

import { NotFoundException } from '../../../../shared/domain/exceptions';
import {
  COLLECTION_REPOSITORY,
  CollectionRepository,
} from '../../../collections/domain/collection.repository';
import {
  SPACE_REPOSITORY,
  SpaceRepository,
} from '../../../spaces/domain/space.repository';
import { Thing } from '../../domain/thing.entity';
import {
  THING_REPOSITORY,
  ThingRepository,
} from '../../domain/thing.repository';

@Injectable()
export class ThingAccessService {
  constructor(
    @Inject(THING_REPOSITORY)
    private readonly things: ThingRepository,
    @Inject(COLLECTION_REPOSITORY)
    private readonly collections: CollectionRepository,
    @Inject(SPACE_REPOSITORY)
    private readonly spaces: SpaceRepository,
  ) {}

  async requireOwnedThing(userId: string, thingId: string): Promise<Thing> {
    const thing = await this.things.findById(thingId);
    if (!thing) {
      throw new NotFoundException('Thing', thingId);
    }

    const collection = await this.collections.findById(thing.collectionId);
    if (!collection) {
      throw new NotFoundException('Thing', thingId);
    }

    const space = await this.spaces.findById(collection.spaceId);
    if (!space || space.userId !== userId) {
      throw new NotFoundException('Thing', thingId);
    }

    return thing;
  }

  async requireOwnedCollection(
    userId: string,
    collectionId: string,
  ): Promise<void> {
    const collection = await this.collections.findById(collectionId);
    if (!collection) {
      throw new NotFoundException('Collection', collectionId);
    }

    const space = await this.spaces.findById(collection.spaceId);
    if (!space || space.userId !== userId) {
      throw new NotFoundException('Collection', collectionId);
    }
  }
}
