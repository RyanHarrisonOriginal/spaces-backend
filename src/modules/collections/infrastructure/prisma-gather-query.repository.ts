import { Injectable } from '@nestjs/common';
import { GatherQuery as PrismaGatherQuery } from '@prisma/client';

import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { GatherQuery } from '../domain/gather-query.entity';
import { GatherQueryRepository } from '../domain/gather-query.repository';

@Injectable()
export class PrismaGatherQueryRepository extends GatherQueryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<GatherQuery | null> {
    const row = await this.prisma.gatherQuery.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByCollectionId(collectionId: string): Promise<GatherQuery[]> {
    const rows = await this.prisma.gatherQuery.findMany({
      where: { collectionId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(entity: GatherQuery): Promise<GatherQuery> {
    const row = await this.prisma.gatherQuery.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        collectionId: entity.collectionId,
        query: entity.query,
        createdAt: entity.createdAt,
      },
      update: {
        query: entity.query,
      },
    });
    return this.toDomain(row);
  }

  async replaceForCollection(
    collectionId: string,
    queries: GatherQuery[],
  ): Promise<GatherQuery[]> {
    return this.prisma.$transaction(async (tx) => {
      await tx.gatherQuery.deleteMany({ where: { collectionId } });
      if (!queries.length) return [];

      await tx.gatherQuery.createMany({
        data: queries.map((q) => ({
          id: q.id,
          collectionId: q.collectionId,
          query: q.query,
          createdAt: q.createdAt,
        })),
      });

      const rows = await tx.gatherQuery.findMany({
        where: { collectionId },
        orderBy: { createdAt: 'asc' },
      });
      return rows.map((row) => this.toDomain(row));
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.gatherQuery.delete({ where: { id } });
  }

  private toDomain(row: PrismaGatherQuery): GatherQuery {
    return GatherQuery.reconstitute({
      id: row.id,
      collectionId: row.collectionId,
      query: row.query,
      createdAt: row.createdAt,
    });
  }
}
