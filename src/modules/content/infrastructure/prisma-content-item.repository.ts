
import { PrismaClient } from '@prisma/client';
import { ContentItem } from '../domain/content-item.entity';
import {
  ContentItemRepository,
  ContentItemSave,
} from '../domain/content-item.repository';
import {
  ReplaceContentItemsSaveStrategy,
  UpsertContentItemSaveStrategy,
} from './content-item-save.strategies';
import { PrismaContentItemMapper } from './prisma-content-item.mapper';

export class PrismaContentItemRepository extends ContentItemRepository {
  private readonly mapper = new PrismaContentItemMapper();
  private readonly upsertStrategy = new UpsertContentItemSaveStrategy();
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
    entity: ContentItem,
    strategy?: typeof ContentItemSave.Upsert,
  ): Promise<ContentItem>;
  async save(
    input: { collectionId: string; items: ContentItem[] },
    strategy: typeof ContentItemSave.Replace,
  ): Promise<ContentItem[]>;
  async save(
    entityOrInput:
      | ContentItem
      | { collectionId: string; items: ContentItem[] },
  ): Promise<ContentItem | ContentItem[]> {
    if ('items' in entityOrInput) {
      return this.replaceStrategy.execute({
        prisma: this.prisma,
        mapper: this.mapper,
        collectionId: entityOrInput.collectionId,
        entities: entityOrInput.items,
      });
    }
    return this.upsertStrategy.execute({
      prisma: this.prisma,
      mapper: this.mapper,
      entity: entityOrInput,
    });
  }

  private async getById(id: string): Promise<ContentItem | null> {
    const row = await this.prisma.contentItem.findUnique({ where: { id } });
    return row ? this.mapper.toDomain(row) : null;
  }

  private async getByCollectionId(
    collectionId: string,
  ): Promise<ContentItem[]> {
    const rows = await this.prisma.contentItem.findMany({
      where: { collectionId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => this.mapper.toDomain(row));
  }
}
