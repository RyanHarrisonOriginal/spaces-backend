import { Injectable } from '@nestjs/common';
import { Collection as PrismaCollection } from '@prisma/client';

import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { Collection } from '../domain/collection.entity';
import { CollectionRepository } from '../domain/collection.repository';

@Injectable()
export class PrismaCollectionRepository extends CollectionRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Collection | null> {
    const row = await this.prisma.collection.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findBySpaceId(spaceId: string): Promise<Collection[]> {
    const rows = await this.prisma.collection.findMany({
      where: { spaceId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(entity: Collection): Promise<Collection> {
    const row = await this.prisma.collection.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        spaceId: entity.spaceId,
        name: entity.name,
        description: entity.description,
        sortOrder: entity.sortOrder,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      update: {
        name: entity.name,
        description: entity.description,
        sortOrder: entity.sortOrder,
        updatedAt: entity.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.collection.delete({ where: { id } });
  }

  private toDomain(row: PrismaCollection): Collection {
    return Collection.reconstitute({
      id: row.id,
      spaceId: row.spaceId,
      name: row.name,
      description: row.description,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
