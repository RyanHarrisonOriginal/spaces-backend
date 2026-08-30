import {
  ContentItem as PrismaContentItem,
  ContentType as PrismaContentType,
} from '@prisma/client';

import { ContentItem, ContentType } from '../domain/content-item.entity';

export class PrismaContentItemMapper {
  toDomain(row: PrismaContentItem): ContentItem {
    return ContentItem.reconstitute({
      id: row.id,
      collectionId: row.collectionId,
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

  toCreateData(entity: ContentItem) {
    return {
      id: entity.id,
      collectionId: entity.collectionId,
      sourceId: entity.sourceId,
      type: entity.type as PrismaContentType,
      title: entity.title,
      thumbnail: entity.thumbnail,
      url: entity.url,
      meta: entity.meta,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
    };
  }

  toUpdateData(entity: ContentItem) {
    return {
      sourceId: entity.sourceId,
      type: entity.type as PrismaContentType,
      title: entity.title,
      thumbnail: entity.thumbnail,
      url: entity.url,
      meta: entity.meta,
      sortOrder: entity.sortOrder,
    };
  }
}
