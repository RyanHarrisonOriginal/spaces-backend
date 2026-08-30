
import { PrismaClient } from '@prisma/client';
import { Space } from '../domain/space.entity';
import {
  SpaceRepository,
  SpaceSaveStrategy,
  SpaceSaveStrategyName,
} from '../domain/space.repository';
import { PrismaSpaceMapper } from './prisma-space.mapper';
import {
  DeleteSpaceSaveStrategy,
  UpsertSpaceSaveStrategy,
} from './space-save.strategies';

export class PrismaSpaceRepository extends SpaceRepository {
  private readonly spaceMapper = new PrismaSpaceMapper();
  private readonly saveStrategies = {
    [SpaceSaveStrategy.Upsert]: new UpsertSpaceSaveStrategy(),
    [SpaceSaveStrategy.Delete]: new DeleteSpaceSaveStrategy(),
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
    strategy: SpaceSaveStrategyName = SpaceSaveStrategy.Upsert,
  ): Promise<Space> {
    return this.saveStrategies[strategy].execute({
      prisma: this.prisma,
      mapper: this.spaceMapper,
      entity,
    });
  }

  private async getById(id: string): Promise<Space | null> {
    const row = await this.prisma.space.findUnique({ where: { id } });
    return row ? this.spaceMapper.toDomain(row) : null;
  }

  private async getByUserId(userId: string): Promise<Space[]> {
    const rows = await this.prisma.space.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.spaceMapper.toDomain(row));
  }
}
