import { Space } from './space.entity';

export const SpaceSaveStrategy = {
  Upsert: 'upsert',
  Delete: 'delete',
} as const;

export type SpaceSaveStrategyName =
  (typeof SpaceSaveStrategy)[keyof typeof SpaceSaveStrategy];

export abstract class SpaceRepository {
  abstract get(id: string): Promise<Space | null>;
  abstract get(query: { userId: string }): Promise<Space[]>;
  abstract save(
    entity: Space,
    strategy?: SpaceSaveStrategyName,
  ): Promise<Space>;
}

