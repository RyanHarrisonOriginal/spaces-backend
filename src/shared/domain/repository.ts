export abstract class Repository<T, TId = string> {
  abstract findById(id: TId): Promise<T | null>;
  abstract save(entity: T): Promise<T>;
  abstract delete(id: TId): Promise<void>;
}
