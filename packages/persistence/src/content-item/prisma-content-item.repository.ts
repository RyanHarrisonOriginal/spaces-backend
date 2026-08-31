import { PrismaClient } from '@prisma/client';

import { ContentItem } from './content-item.entity';
import { ReplaceContentItemsSaveStrategy } from './content-item-save.strategies';
import {
  ContentItemRepository,
  ContentItemSaveStrategy,
} from './content-item.repository';
import { PrismaContentItemMapper } from './prisma-content-item.mapper';

export class PrismaContentItemRepository extends ContentItemRepository {
  private readonly contentItemMapper = new PrismaContentItemMapper();
  private readonly replaceStrategy = new ReplaceContentItemsSaveStrategy();

  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async get(id: string): Promise<ContentItem | null>;
  async get(query: { collectionId: string }): Promise<ContentItem[]>;
  async get(
    idOrQuery: string | { collectionId: string },
  ): Promise<ContentItem | ContentItem[] | null> {
    if (typeof idOrQuery === 'string') {
      return this.getById(idOrQuery);
    }
    return this.getByCollectionId(idOrQuery.collectionId);
  }

  async save(
    input: { collectionId: string; items: ContentItem[] },
    _strategy: typeof ContentItemSaveStrategy.Replace,
  ): Promise<ContentItem[]> {
    return this.replaceStrategy.execute({
      prisma: this.prisma,
      mapper: this.contentItemMapper,
      collectionId: input.collectionId,
      entities: input.items,
    });
  }

  private async getById(id: string): Promise<ContentItem | null> {
    const row = await this.prisma.contentItem.findUnique({ where: { id } });
    return row ? this.contentItemMapper.toDomain(row) : null;
  }

  private async getByCollectionId(
    collectionId: string,
  ): Promise<ContentItem[]> {
    const rows = await this.prisma.contentItem.findMany({
      where: { collectionId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((row) => this.contentItemMapper.toDomain(row));
  }
}
