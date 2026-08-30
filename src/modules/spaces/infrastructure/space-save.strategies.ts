import { PrismaClient } from '@prisma/client';
import { SaveStrategy } from '../../../shared/domain/repository';
import { Space } from '../domain/space.entity';
import { PrismaSpaceMapper } from './prisma-space.mapper';

export type SpaceSaveContext = {
  prisma: PrismaClient;
  mapper: PrismaSpaceMapper;
  entity: Space;
};

export class UpsertSpaceSaveStrategy
  implements SaveStrategy<SpaceSaveContext, Space>
{
  async execute({
    prisma,
    mapper,
    entity,
  }: SpaceSaveContext): Promise<Space> {
    const row = await prisma.space.upsert({
      where: { id: entity.id },
      create: mapper.toCreateData(entity),
      update: mapper.toUpdateData(entity),
    });
    return mapper.toDomain(row);
  }
}

export class DeleteSpaceSaveStrategy
  implements SaveStrategy<SpaceSaveContext, Space>
{
  async execute({ prisma, entity }: SpaceSaveContext): Promise<Space> {
    await prisma.space.delete({ where: { id: entity.id } });
    return entity;
  }
}
