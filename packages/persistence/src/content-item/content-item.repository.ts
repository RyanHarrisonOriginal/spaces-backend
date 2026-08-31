import { ContentItem } from './content-item.entity';

export const ContentItemSaveStrategy = {
  Replace: 'replace',
} as const;

export type ContentItemSaveStrategyName =
  (typeof ContentItemSaveStrategy)[keyof typeof ContentItemSaveStrategy];

export abstract class ContentItemRepository {
  abstract get(id: string): Promise<ContentItem | null>;
  abstract get(query: { collectionId: string }): Promise<ContentItem[]>;
  abstract save(
    input: { collectionId: string; items: ContentItem[] },
    strategy: typeof ContentItemSaveStrategy.Replace,
  ): Promise<ContentItem[]>;
}
