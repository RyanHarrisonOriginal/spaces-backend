import { GatherQuery } from './gather-query.entity';

export const GatherQuerySave = {
  Upsert: 'upsert',
  Replace: 'replace',
} as const;

export type GatherQuerySaveStrategyName =
  (typeof GatherQuerySave)[keyof typeof GatherQuerySave];

export abstract class GatherQueryRepository {
  abstract get(id: string): Promise<GatherQuery | null>;
  abstract get(query: { collectionId: string }): Promise<GatherQuery[]>;
  abstract save(
    entity: GatherQuery,
    strategy?: typeof GatherQuerySave.Upsert,
  ): Promise<GatherQuery>;
  abstract save(
    input: { collectionId: string; items: GatherQuery[] },
    strategy: typeof GatherQuerySave.Replace,
  ): Promise<GatherQuery[]>;
}

