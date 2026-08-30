import type { ZodType } from 'zod';

export type StructuredLlmResult<T> = {
  data: T;
  provider: string;
  model: string;
};

export interface LlmProvider {
  generateStructured<T>(input: {
    systemPrompt: string;
    userPrompt: string;
    schema: ZodType<T>;
  }): Promise<StructuredLlmResult<T>>;
}
