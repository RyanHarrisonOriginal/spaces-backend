
import { PrismaClient } from '@prisma/client';
import { Collection } from '../domain/collection.entity';
import {
  CollectionRepository,
  CollectionSaveStrategy,
  CollectionSaveStrategyName,
} from '../domain/collection.repository';
import {
  DeleteCollectionSaveStrategy,
  UpsertCollectionSaveStrategy,
} from './collection-save.strategies';
import { PrismaCollectionMapper } from './prisma-collection.mapper';

export class PrismaCollectionRepository extends CollectionRepository {
  private readonly collectionMapper = new PrismaCollectionMapper();
  private readonly saveStrategies = {
    [CollectionSaveStrategy.Upsert]: new UpsertCollectionSaveStrategy(),
    [CollectionSaveStrategy.Delete]: new DeleteCollectionSaveStrategy(),
  };

  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async get(id: string): Promise<Collection | null>;
  async get(query: { spaceId: string }): Promise<Collection[]>;
  async get(
    idOrQuery: string | { spaceId: string },
  ): Promise<Collection | Collection[] | null> {
    if (typeof idOrQuery === 'string') {
      return this.getById(idOrQuery);
    }
    return this.getBySpaceId(idOrQuery.spaceId);
  }

  async save(
    entity: Collection,
    strategy: CollectionSaveStrategyName = CollectionSaveStrategy.Upsert,
  ): Promise<Collection> {
    return this.saveStrategies[strategy].execute({
      prisma: this.prisma,
      mapper: this.collectionMapper,
      entity,
    });
  }

  private async getById(id: string): Promise<Collection | null> {
    const row = await this.prisma.collection.findUnique({ where: { id } });
    return row ? this.collectionMapper.toDomain(row) : null;
  }

  private async getBySpaceId(spaceId: string): Promise<Collection[]> {
    const rows = await this.prisma.collection.findMany({
      where: { spaceId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => this.collectionMapper.toDomain(row));
  }
}
