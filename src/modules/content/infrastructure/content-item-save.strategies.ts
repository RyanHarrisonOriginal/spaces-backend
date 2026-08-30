import { PrismaClient } from '@prisma/client';
import { SaveStrategy } from '../../../shared/domain/repository';
import { ContentItem } from '../domain/content-item.entity';
import { PrismaContentItemMapper } from './prisma-content-item.mapper';

export type ContentItemSaveContext = {
  prisma: PrismaClient;
  mapper: PrismaContentItemMapper;
  entity: ContentItem;
};

export type ReplaceContentItemsSaveContext = {
  prisma: PrismaClient;
  mapper: PrismaContentItemMapper;
  collectionId: string;
  entities: ContentItem[];
};

export class UpsertContentItemSaveStrategy
  implements SaveStrategy<ContentItemSaveContext, ContentItem>
{
  async execute({
    prisma,
    mapper,
    entity,
  }: ContentItemSaveContext): Promise<ContentItem> {
    const row = await prisma.contentItem.upsert({
      where: { id: entity.id },
      create: mapper.toCreateData(entity),
      update: mapper.toUpdateData(entity),
    });
    return mapper.toDomain(row);
  }
}

export class ReplaceContentItemsSaveStrategy
  implements SaveStrategy<ReplaceContentItemsSaveContext, ContentItem[]>
{
  async execute({
    prisma,
    mapper,
    collectionId,
    entities,
  }: ReplaceContentItemsSaveContext): Promise<ContentItem[]> {
    await prisma.$transaction([
      prisma.contentItem.deleteMany({ where: { collectionId } }),
      ...(entities.length
        ? [
            prisma.contentItem.createMany({
              data: entities.map((entity) => mapper.toCreateData(entity)),
            }),
          ]
        : []),
    ]);

    const rows = await prisma.contentItem.findMany({
      where: { collectionId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => mapper.toDomain(row));
  }
}
