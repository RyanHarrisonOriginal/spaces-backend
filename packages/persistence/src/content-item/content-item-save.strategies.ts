import { PrismaClient } from '@prisma/client';

import { SaveStrategy } from '../save-strategy';
import { ContentItem } from './content-item.entity';
import { PrismaContentItemMapper } from './prisma-content-item.mapper';

export type ReplaceContentItemsSaveContext = {
  prisma: PrismaClient;
  mapper: PrismaContentItemMapper;
  collectionId: string;
  entities: ContentItem[];
};

export class ReplaceContentItemsSaveStrategy
  implements SaveStrategy<ReplaceContentItemsSaveContext, ContentItem[]>
{
  async execute({
    prisma,
    mapper,
    collectionId,
    entities,
  }: ReplaceContentItemsSaveContext): Promise<ContentItem[]> {
    return prisma.$transaction(async (tx) => {
      await tx.contentItem.deleteMany({ where: { collectionId } });
      if (entities.length) {
        await tx.contentItem.createMany({
          data: entities.map((entity) => mapper.toCreateData(entity)),
        });
      }
      const rows = await tx.contentItem.findMany({
        where: { collectionId },
        orderBy: { sortOrder: 'asc' },
      });
      return rows.map((row) => mapper.toDomain(row));
    });
  }
}
