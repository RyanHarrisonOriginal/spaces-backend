import { Collection } from './collection.entity';

export const CollectionSave = {
  Upsert: 'upsert',
  Delete: 'delete',
} as const;

export type CollectionSaveStrategyName =
  (typeof CollectionSave)[keyof typeof CollectionSave];

export abstract class CollectionRepository {
  abstract get(id: string): Promise<Collection | null>;
  abstract get(query: { spaceId: string }): Promise<Collection[]>;
  abstract save(
    entity: Collection,
    strategy?: CollectionSaveStrategyName,
  ): Promise<Collection>;
}

