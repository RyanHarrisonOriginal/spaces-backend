
import { PrismaClient } from '@prisma/client';
import { Space } from '../domain/space.entity';
import {
  SpaceRepository,
  SpaceSave,
  SpaceSaveStrategyName,
} from '../domain/space.repository';
import { PrismaSpaceMapper } from './prisma-space.mapper';
import {
  DeleteSpaceSaveStrategy,
  UpsertSpaceSaveStrategy,
} from './space-save.strategies';

export class PrismaSpaceRepository extends SpaceRepository {
  private readonly mapper = new PrismaSpaceMapper();
  private readonly strategies = {
    [SpaceSave.Upsert]: new UpsertSpaceSaveStrategy(),
    [SpaceSave.Delete]: new DeleteSpaceSaveStrategy(),
  };

  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async get(id: string): Promise<Space | null>;
  async get(query: { userId: string }): Promise<Space[]>;
  async get(
    idOrQuery: string | { userId: string },
  ): Promise<Space | Space[] | null> {
    if (typeof idOrQuery === 'string') {
      return this.getById(idOrQuery);
    }
    return this.getByUserId(idOrQuery.userId);
  }

  async save(
    entity: Space,
    strategy: SpaceSaveStrategyName = SpaceSave.Upsert,
  ): Promise<Space> {
    return this.strategies[strategy].execute({
      prisma: this.prisma,
      mapper: this.mapper,
      entity,
    });
  }

  private async getById(id: string): Promise<Space | null> {
    const row = await this.prisma.space.findUnique({ where: { id } });
    return row ? this.mapper.toDomain(row) : null;
  }

  private async getByUserId(userId: string): Promise<Space[]> {
    const rows = await this.prisma.space.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.mapper.toDomain(row));
  }
}
