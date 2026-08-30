import OpenAI from 'openai';
import { ZodError, type ZodType } from 'zod';

import { LlmGenerationError } from '../../../application/errors/llm-generation.error';
import type {
  LlmProvider,
  StructuredLlmResult,
} from '../../../application/ports/llm-provider.port';

const DEFAULT_MODEL = 'gpt-4o-mini';

export type OpenAiChatClient = {
  chat: {
    completions: {
      create(params: {
        model: string;
        temperature?: number;
        response_format?: { type: 'json_object' };
        messages: Array<{ role: 'system' | 'user'; content: string }>;
      }): Promise<{
        model?: string;
        choices: Array<{ message?: { content?: string | null } }>;
      }>;
    };
  };
};

export class OpenAiAdapter implements LlmProvider {
  private readonly client: OpenAiChatClient;
  private readonly model: string;

  constructor(options: {
    apiKey?: string;
    model?: string;
    client?: OpenAiChatClient;
  }) {
    this.model = options.model ?? DEFAULT_MODEL;
    this.client =
      options.client ??
      new OpenAI({
        apiKey: options.apiKey ?? process.env.OPENAI_API_KEY,
      });
  }

  static fromEnv(): OpenAiAdapter {
    return new OpenAiAdapter({
      apiKey: process.env.OPENAI_API_KEY,
      model:
        process.env.OPENAI_DISCOVERY_MODEL ??
        process.env.OPENAI_MODEL ??
        DEFAULT_MODEL,
    });
  }

  async generateStructured<T>(input: {
    systemPrompt: string;
    userPrompt: string;
    schema: ZodType<T>;
  }): Promise<StructuredLlmResult<T>> {
    let completion: Awaited<
      ReturnType<OpenAiChatClient['chat']['completions']['create']>
    >;
    try {
      completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: input.systemPrompt },
          { role: 'user', content: input.userPrompt },
        ],
      });
    } catch (error) {
      throw new LlmGenerationError(
        error instanceof Error ? error.message : 'OpenAI request failed',
      );
    }

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new LlmGenerationError(
        'OpenAI response did not include message content',
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content) as unknown;
    } catch {
      throw new LlmGenerationError('OpenAI response was not valid JSON');
    }

    try {
      return {
        data: input.schema.parse(parsed),
        provider: 'openai',
        model: completion.model ?? this.model,
      };
    } catch (error) {
      if (error instanceof ZodError) {
        throw new LlmGenerationError(
          `LLM output failed schema validation: ${error.message}`,
        );
      }
      throw error;
    }
  }
}
