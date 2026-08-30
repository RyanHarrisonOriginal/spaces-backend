export { SaveStrategy } from '../../../packages/persistence/src/save-strategy';

export abstract class Repository<T, TId = string> {
  abstract get(id: TId): Promise<T | null>;
  abstract save(entity: T): Promise<T>;
}
