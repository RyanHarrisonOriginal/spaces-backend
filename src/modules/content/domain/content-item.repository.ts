import { ContentItem } from './content-item.entity';

export const ContentItemSave = {
  Upsert: 'upsert',
  Replace: 'replace',
} as const;

export abstract class ContentItemRepository {
  abstract get(id: string): Promise<ContentItem | null>;
  abstract get(query: { collectionId: string }): Promise<ContentItem[]>;
  abstract save(
    entity: ContentItem,
    strategy?: typeof ContentItemSave.Upsert,
  ): Promise<ContentItem>;
  abstract save(
    input: { collectionId: string; items: ContentItem[] },
    strategy: typeof ContentItemSave.Replace,
  ): Promise<ContentItem[]>;
}

