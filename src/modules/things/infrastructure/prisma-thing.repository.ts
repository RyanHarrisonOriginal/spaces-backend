import { Injectable } from '@nestjs/common';
import {
  ContentType as PrismaContentType,
  Thing as PrismaThing,
  ThingStatus as PrismaThingStatus,
} from '@prisma/client';

import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  ContentType,
  Thing,
  ThingStatus,
} from '../domain/thing.entity';
import { ThingRepository } from '../domain/thing.repository';

type ThingRow = PrismaThing & {
  contentTypes: { contentType: PrismaContentType }[];
};

@Injectable()
export class PrismaThingRepository extends ThingRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Thing | null> {
    const row = await this.prisma.thing.findUnique({
      where: { id },
      include: { contentTypes: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByCollectionId(collectionId: string): Promise<Thing[]> {
    const rows = await this.prisma.thing.findMany({
      where: { collectionId },
      include: { contentTypes: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(entity: Thing): Promise<Thing> {
    const row = await this.prisma.$transaction(async (tx) => {
      await tx.thing.upsert({
        where: { id: entity.id },
        create: {
          id: entity.id,
          collectionId: entity.collectionId,
          name: entity.name,
          description: entity.description,
          status: entity.status as PrismaThingStatus,
          sortOrder: entity.sortOrder,
          createdAt: entity.createdAt,
          updatedAt: entity.updatedAt,
        },
        update: {
          name: entity.name,
          description: entity.description,
          status: entity.status as PrismaThingStatus,
          sortOrder: entity.sortOrder,
          updatedAt: entity.updatedAt,
        },
      });

      await tx.thingContentType.deleteMany({ where: { thingId: entity.id } });
      if (entity.contentTypes.length) {
        await tx.thingContentType.createMany({
          data: entity.contentTypes.map((contentType) => ({
            thingId: entity.id,
            contentType: contentType as PrismaContentType,
          })),
        });
      }

      return tx.thing.findUniqueOrThrow({
        where: { id: entity.id },
        include: { contentTypes: true },
      });
    });

    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.thing.delete({ where: { id } });
  }

  private toDomain(row: ThingRow): Thing {
    return Thing.reconstitute({
      id: row.id,
      collectionId: row.collectionId,
      name: row.name,
      description: row.description,
      status: row.status as ThingStatus,
      sortOrder: row.sortOrder,
      contentTypes: row.contentTypes.map(
        (ct) => ct.contentType as ContentType,
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
