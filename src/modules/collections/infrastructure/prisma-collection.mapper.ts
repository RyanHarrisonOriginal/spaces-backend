import { Collection as PrismaCollection } from '@prisma/client';

import {
  Collection,
  normalizeBraveContentTypes,
} from '../domain/collection.entity';

export class PrismaCollectionMapper {
  toDomain(row: PrismaCollection): Collection {
    return Collection.reconstitute({
      id: row.id,
      spaceId: row.spaceId,
      name: row.name,
      description: row.description,
      gatherSource: row.gatherSource,
      braveContentTypes: normalizeBraveContentTypes(row.braveContentTypes),
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  toCreateData(entity: Collection) {
    return {
      id: entity.id,
      spaceId: entity.spaceId,
      name: entity.name,
      description: entity.description,
      gatherSource: entity.gatherSource,
      braveContentTypes: entity.braveContentTypes,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toUpdateData(entity: Collection) {
    return {
      name: entity.name,
      description: entity.description,
      gatherSource: entity.gatherSource,
      braveContentTypes: entity.braveContentTypes,
      sortOrder: entity.sortOrder,
      updatedAt: entity.updatedAt,
    };
  }
}
