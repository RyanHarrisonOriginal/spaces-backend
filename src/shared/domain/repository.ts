export abstract class Repository<T, TId = string> {
  abstract get(id: TId): Promise<T | null>;
  abstract save(entity: T): Promise<T>;
}

export interface SaveStrategy<TContext, TResult> {
  execute(context: TContext): Promise<TResult>;
}
