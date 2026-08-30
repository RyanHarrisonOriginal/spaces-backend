import { Source } from './source.entity';

export abstract class SourceRepository {
  abstract get(id: string): Promise<Source | null>;
  abstract get(query: { active: true }): Promise<Source[]>;
  abstract save(entity: Source): Promise<Source>;
}

