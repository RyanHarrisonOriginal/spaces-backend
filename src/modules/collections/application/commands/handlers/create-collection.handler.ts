import { randomUUID } from 'crypto';

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
import { CreateCollectionCommand } from '../create-collection.command';

export class CreateCollectionHandler {
  constructor(
    private readonly collectionRepo: CollectionRepository,
    private readonly spaceRepo: SpaceRepository,
  ) {}

  async execute(command: CreateCollectionCommand): Promise<Collection> {
    const space = await this.spaceRepo.get(command.spaceId);
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
      return this.collectionRepo.save(collection);
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid collection',
      );
    }
  }
}
