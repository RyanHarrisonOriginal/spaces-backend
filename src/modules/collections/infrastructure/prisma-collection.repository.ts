
import { PrismaClient } from '@prisma/client';
import { Collection } from '../domain/collection.entity';
import {
  CollectionRepository,
  CollectionSave,
  CollectionSaveStrategyName,
} from '../domain/collection.repository';
import {
  DeleteCollectionSaveStrategy,
  UpsertCollectionSaveStrategy,
} from './collection-save.strategies';
import { PrismaCollectionMapper } from './prisma-collection.mapper';

export class PrismaCollectionRepository extends CollectionRepository {
  private readonly mapper = new PrismaCollectionMapper();
  private readonly strategies = {
    [CollectionSave.Upsert]: new UpsertCollectionSaveStrategy(),
    [CollectionSave.Delete]: new DeleteCollectionSaveStrategy(),
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
    strategy: CollectionSaveStrategyName = CollectionSave.Upsert,
  ): Promise<Collection> {
    return this.strategies[strategy].execute({
      prisma: this.prisma,
      mapper: this.mapper,
      entity,
    });
  }

  private async getById(id: string): Promise<Collection | null> {
    const row = await this.prisma.collection.findUnique({ where: { id } });
    return row ? this.mapper.toDomain(row) : null;
  }

  private async getBySpaceId(spaceId: string): Promise<Collection[]> {
    const rows = await this.prisma.collection.findMany({
      where: { spaceId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => this.mapper.toDomain(row));
  }
}
