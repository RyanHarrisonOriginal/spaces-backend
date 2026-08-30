import { PrismaClient } from '@prisma/client';
import { Collection } from '../domain/collection.entity';
import { PrismaCollectionMapper } from './prisma-collection.mapper';
import { SaveStrategy } from '../../../shared/domain/repository';

export type CollectionSaveContext = {
  prisma: PrismaClient;
  mapper: PrismaCollectionMapper;
  entity: Collection;
};

export class UpsertCollectionSaveStrategy
  implements SaveStrategy<CollectionSaveContext, Collection>
{
  async execute({
    prisma,
    mapper,
    entity,
  }: CollectionSaveContext): Promise<Collection> {
    const row = await prisma.collection.upsert({
      where: { id: entity.id },
      create: mapper.toCreateData(entity),
      update: mapper.toUpdateData(entity),
    });
    return mapper.toDomain(row);
  }
}

export class DeleteCollectionSaveStrategy
  implements SaveStrategy<CollectionSaveContext, Collection>
{
  async execute({
    prisma,
    entity,
  }: CollectionSaveContext): Promise<Collection> {
    await prisma.collection.delete({ where: { id: entity.id } });
    return entity;
  }
}
