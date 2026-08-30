
import { PrismaClient } from '@prisma/client';
import { Source } from '../domain/source.entity';
import { SourceRepository } from '../domain/source.repository';
import { PrismaSourceMapper } from './prisma-source.mapper';
import { UpdateSourceSaveStrategy } from './source-save.strategies';

export class PrismaSourceRepository extends SourceRepository {
  private readonly mapper = new PrismaSourceMapper();
  private readonly updateStrategy = new UpdateSourceSaveStrategy();

  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async get(id: string): Promise<Source | null>;
  async get(query: { active: true }): Promise<Source[]>;
  async get(
    idOrQuery: string | { active: true },
  ): Promise<Source | Source[] | null> {
    if (typeof idOrQuery === 'string') {
      return this.getById(idOrQuery);
    }
    return this.getActive();
  }

  async save(entity: Source): Promise<Source> {
    return this.updateStrategy.execute({
      prisma: this.prisma,
      mapper: this.mapper,
      entity,
    });
  }

  private async getById(id: string): Promise<Source | null> {
    const row = await this.prisma.source.findUnique({
      where: { id },
      include: { contentTypes: true },
    });
    return row ? this.mapper.toDomain(row) : null;
  }

  private async getActive(): Promise<Source[]> {
    const rows = await this.prisma.source.findMany({
      where: { isActive: true },
      include: { contentTypes: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.mapper.toDomain(row));
  }
}
