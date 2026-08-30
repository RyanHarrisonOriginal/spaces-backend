import { GatherQuery } from './gather-query.entity';

export const GatherQuerySaveStrategy = {
  Upsert: 'upsert',
  Replace: 'replace',
} as const;

export type GatherQuerySaveStrategyName =
  (typeof GatherQuerySaveStrategy)[keyof typeof GatherQuerySaveStrategy];

export abstract class GatherQueryRepository {
  abstract get(id: string): Promise<GatherQuery | null>;
  abstract get(query: { collectionId: string }): Promise<GatherQuery[]>;
  abstract save(
    entity: GatherQuery,
    strategy?: typeof GatherQuerySaveStrategy.Upsert,
  ): Promise<GatherQuery>;
  abstract save(
    input: { collectionId: string; items: GatherQuery[] },
    strategy: typeof GatherQuerySaveStrategy.Replace,
  ): Promise<GatherQuery[]>;
}
