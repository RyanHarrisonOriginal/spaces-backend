import { PrismaClient } from '@prisma/client';

import { GatherQuery } from './gather-query.entity';
import {
  GatherQueryRepository,
  GatherQuerySaveStrategy,
} from './gather-query.repository';
import {
  ReplaceGatherQueriesSaveStrategy,
  UpsertGatherQuerySaveStrategy,
} from './gather-query-save.strategies';
import { PrismaGatherQueryMapper } from './prisma-gather-query.mapper';

export class PrismaGatherQueryRepository extends GatherQueryRepository {
  private readonly gatherQueryMapper = new PrismaGatherQueryMapper();
  private readonly upsertStrategy = new UpsertGatherQuerySaveStrategy();
  private readonly replaceStrategy = new ReplaceGatherQueriesSaveStrategy();

  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async get(id: string): Promise<GatherQuery | null>;
  async get(query: { collectionId: string }): Promise<GatherQuery[]>;
  async get(
    idOrQuery: string | { collectionId: string },
  ): Promise<GatherQuery | GatherQuery[] | null> {
    if (typeof idOrQuery === 'string') {
      return this.getById(idOrQuery);
    }
    return this.getByCollectionId(idOrQuery.collectionId);
  }

  async save(
    entity: GatherQuery,
    strategy?: typeof GatherQuerySaveStrategy.Upsert,
  ): Promise<GatherQuery>;
  async save(
    input: { collectionId: string; items: GatherQuery[] },
    strategy: typeof GatherQuerySaveStrategy.Replace,
  ): Promise<GatherQuery[]>;
  async save(
    entityOrInput: GatherQuery | { collectionId: string; items: GatherQuery[] },
  ): Promise<GatherQuery | GatherQuery[]> {
    if ('items' in entityOrInput) {
      return this.replaceStrategy.execute({
        prisma: this.prisma,
        mapper: this.gatherQueryMapper,
        collectionId: entityOrInput.collectionId,
        entities: entityOrInput.items,
      });
    }
    return this.upsertStrategy.execute({
      prisma: this.prisma,
      mapper: this.gatherQueryMapper,
      entity: entityOrInput,
    });
  }

  private async getById(id: string): Promise<GatherQuery | null> {
    const row = await this.prisma.gatherQuery.findUnique({ where: { id } });
    return row ? this.gatherQueryMapper.toDomain(row) : null;
  }

  private async getByCollectionId(collectionId: string): Promise<GatherQuery[]> {
    const rows = await this.prisma.gatherQuery.findMany({
      where: { collectionId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.gatherQueryMapper.toDomain(row));
  }
}
