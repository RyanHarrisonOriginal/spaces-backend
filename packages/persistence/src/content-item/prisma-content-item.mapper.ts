import {
  ContentItem as PrismaContentItem,
  ContentProvider,
  ContentType,
} from '@prisma/client';

import {
  ContentItem,
  type ContentItemType,
  type ContentProviderName,
} from './content-item.entity';

export class PrismaContentItemMapper {
  toDomain(row: PrismaContentItem): ContentItem {
    return ContentItem.reconstitute({
      id: row.id,
      collectionId: row.collectionId,
      provider: row.provider as ContentProviderName,
      externalId: row.externalId,
      type: row.type as ContentItemType,
      title: row.title,
      description: row.description,
      url: row.url,
      thumbnailUrl: row.thumbnailUrl,
      authorName: row.authorName,
      publishedAt: row.publishedAt,
      discoveredByQueries: row.discoveredByQueries,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  toCreateData(entity: ContentItem) {
    return {
      id: entity.id,
      collectionId: entity.collectionId,
      provider: entity.provider as ContentProvider,
      externalId: entity.externalId,
      type: entity.type as ContentType,
      title: entity.title,
      description: entity.description,
      url: entity.url,
      thumbnailUrl: entity.thumbnailUrl,
      authorName: entity.authorName,
      publishedAt: entity.publishedAt,
      discoveredByQueries: entity.discoveredByQueries,
      sortOrder: entity.sortOrder,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
