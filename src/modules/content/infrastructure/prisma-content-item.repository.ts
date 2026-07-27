import { Injectable } from '@nestjs/common';
import {
  ContentItem as PrismaContentItem,
  ContentType as PrismaContentType,
} from '@prisma/client';

import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  ContentItem,
  ContentType,
} from '../domain/content-item.entity';
import { ContentItemRepository } from '../domain/content-item.repository';

@Injectable()
export class PrismaContentItemRepository extends ContentItemRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<ContentItem | null> {
    const row = await this.prisma.contentItem.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByThingId(thingId: string): Promise<ContentItem[]> {
    const rows = await this.prisma.contentItem.findMany({
      where: { thingId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(entity: ContentItem): Promise<ContentItem> {
    const row = await this.prisma.contentItem.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        thingId: entity.thingId,
        sourceId: entity.sourceId,
        type: entity.type as PrismaContentType,
        title: entity.title,
        thumbnail: entity.thumbnail,
        url: entity.url,
        meta: entity.meta,
        sortOrder: entity.sortOrder,
        createdAt: entity.createdAt,
      },
      update: {
        sourceId: entity.sourceId,
        type: entity.type as PrismaContentType,
        title: entity.title,
        thumbnail: entity.thumbnail,
        url: entity.url,
        meta: entity.meta,
        sortOrder: entity.sortOrder,
      },
    });
    return this.toDomain(row);
  }

  async replaceForThing(
    thingId: string,
    items: ContentItem[],
  ): Promise<ContentItem[]> {
    await this.prisma.$transaction([
      this.prisma.contentItem.deleteMany({ where: { thingId } }),
      this.prisma.contentItem.createMany({
        data: items.map((item) => ({
          id: item.id,
          thingId: item.thingId,
          sourceId: item.sourceId,
          type: item.type as PrismaContentType,
          title: item.title,
          thumbnail: item.thumbnail,
          url: item.url,
          meta: item.meta,
          sortOrder: item.sortOrder,
          createdAt: item.createdAt,
        })),
      }),
    ]);
    return this.findByThingId(thingId);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.contentItem.delete({ where: { id } });
  }

  private toDomain(row: PrismaContentItem): ContentItem {
    return ContentItem.reconstitute({
      id: row.id,
      thingId: row.thingId,
      sourceId: row.sourceId,
      type: row.type as ContentType,
      title: row.title,
      thumbnail: row.thumbnail,
      url: row.url,
      meta: row.meta,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
    });
  }
}
