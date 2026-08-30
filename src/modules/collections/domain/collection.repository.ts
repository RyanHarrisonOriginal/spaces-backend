import { Collection } from './collection.entity';

export const CollectionSaveStrategy = {
  Upsert: 'upsert',
  Delete: 'delete',
} as const;

export type CollectionSaveStrategyName =
  (typeof CollectionSaveStrategy)[keyof typeof CollectionSaveStrategy];

export abstract class CollectionRepository {
  abstract get(id: string): Promise<Collection | null>;
  abstract get(query: { spaceId: string }): Promise<Collection[]>;
  abstract save(
    entity: Collection,
    strategy?: CollectionSaveStrategyName,
  ): Promise<Collection>;
}

