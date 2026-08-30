import { PrismaClient } from '@prisma/client';

import { SaveStrategy } from '../save-strategy';
import { GatherQuery } from './gather-query.entity';
import { PrismaGatherQueryMapper } from './prisma-gather-query.mapper';

export type GatherQuerySaveContext = {
  prisma: PrismaClient;
  mapper: PrismaGatherQueryMapper;
  entity: GatherQuery;
};

export type ReplaceGatherQueriesSaveContext = {
  prisma: PrismaClient;
  mapper: PrismaGatherQueryMapper;
  collectionId: string;
  entities: GatherQuery[];
};

export class UpsertGatherQuerySaveStrategy
  implements SaveStrategy<GatherQuerySaveContext, GatherQuery>
{
  async execute({
    prisma,
    mapper,
    entity,
  }: GatherQuerySaveContext): Promise<GatherQuery> {
    const row = await prisma.gatherQuery.upsert({
      where: { id: entity.id },
      create: mapper.toCreateData(entity),
      update: mapper.toUpdateData(entity),
    });
    return mapper.toDomain(row);
  }
}

export class ReplaceGatherQueriesSaveStrategy
  implements SaveStrategy<ReplaceGatherQueriesSaveContext, GatherQuery[]>
{
  async execute({
    prisma,
    mapper,
    collectionId,
    entities,
  }: ReplaceGatherQueriesSaveContext): Promise<GatherQuery[]> {
    return prisma.$transaction(async (tx) => {
      await tx.gatherQuery.deleteMany({ where: { collectionId } });
      if (entities.length) {
        await tx.gatherQuery.createMany({
          data: entities.map((entity) => mapper.toCreateData(entity)),
        });
      }
      const rows = await tx.gatherQuery.findMany({
        where: { collectionId },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map((row) => mapper.toDomain(row));
    });
  }
}
