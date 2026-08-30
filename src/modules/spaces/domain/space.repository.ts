import { Space } from './space.entity';

export const SpaceSave = {
  Upsert: 'upsert',
  Delete: 'delete',
} as const;

export type SpaceSaveStrategyName =
  (typeof SpaceSave)[keyof typeof SpaceSave];

export abstract class SpaceRepository {
  abstract get(id: string): Promise<Space | null>;
  abstract get(query: { userId: string }): Promise<Space[]>;
  abstract save(
    entity: Space,
    strategy?: SpaceSaveStrategyName,
  ): Promise<Space>;
}

