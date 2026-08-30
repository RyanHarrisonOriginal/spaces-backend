import { GatherQuery as PrismaGatherQuery } from '@prisma/client';

import { GatherQuery } from '../domain/gather-query.entity';

export class PrismaGatherQueryMapper {
  toDomain(row: PrismaGatherQuery): GatherQuery {
    return GatherQuery.reconstitute({
      id: row.id,
      collectionId: row.collectionId,
      query: row.query,
      createdAt: row.createdAt,
    });
  }

  toCreateData(entity: GatherQuery) {
    return {
      id: entity.id,
      collectionId: entity.collectionId,
      query: entity.query,
      createdAt: entity.createdAt,
    };
  }

  toUpdateData(entity: GatherQuery) {
    return { query: entity.query };
  }
}
