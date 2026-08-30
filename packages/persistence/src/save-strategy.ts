export interface SaveStrategy<TContext, TResult> {
  execute(context: TContext): Promise<TResult>;
}
