import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { collectionDiscoveryProfileSchema } from '../../../domain/collection-discovery-profile';
import { LlmGenerationError } from '../../../application/errors/llm-generation.error';
import type { LlmProvider } from '../../../application/ports/llm-provider.port';
import { OpenAiAdapter, type OpenAiChatClient } from './openai.adapter';

const validPayload = {
  topics: ['jab teep combination'],
  searchQueries: ['muay thai jab teep combination technique'],
  positiveSignals: ['technique breakdown'],
  negativeSignals: ['highlight reels'],
};

function clientReturning(
  content: string | null,
  captured: Array<{ temperature?: number; systemContent?: string }> = [],
): OpenAiChatClient {
  return {
    chat: {
      completions: {
        async create(params) {
          captured.push({
            temperature: params.temperature,
            systemContent: params.messages[0]?.content,
          });
          return {
            model: params.model,
            choices: [{ message: { content } }],
          };
        },
      },
    },
  };
}

describe('OpenAiAdapter', () => {
  it('satisfies the LlmProvider contract for valid structured JSON', async () => {
    const adapter: LlmProvider = new OpenAiAdapter({
      client: clientReturning(JSON.stringify(validPayload)),
      model: 'gpt-4o-mini',
    });

    const result = await adapter.generateStructured({
      systemPrompt: 'system',
      userPrompt: 'user',
      schema: collectionDiscoveryProfileSchema,
    });

    assert.equal(result.provider, 'openai');
    assert.equal(result.model, 'gpt-4o-mini');
    assert.deepEqual(result.data.topics, validPayload.topics);
    assert.deepEqual(result.data.searchQueries, validPayload.searchQueries);
  });

  it('omits temperature for gpt-5 models that only support the default', async () => {
    const captured: Array<{ temperature?: number }> = [];
    const adapter = new OpenAiAdapter({
      client: clientReturning(JSON.stringify(validPayload), captured),
      model: 'gpt-5-mini',
    });

    await adapter.generateStructured({
      systemPrompt: 'system',
      userPrompt: 'user',
      schema: collectionDiscoveryProfileSchema,
    });

    assert.equal(captured[0]?.temperature, undefined);
  });

  it('sends a low temperature for models that support it', async () => {
    const captured: Array<{ temperature?: number }> = [];
    const adapter = new OpenAiAdapter({
      client: clientReturning(JSON.stringify(validPayload), captured),
      model: 'gpt-4o-mini',
    });

    await adapter.generateStructured({
      systemPrompt: 'system',
      userPrompt: 'user',
      schema: collectionDiscoveryProfileSchema,
    });

    assert.equal(captured[0]?.temperature, 0.2);
  });

  it('adds a JSON instruction when the prompt does not mention json', async () => {
    const captured: Array<{ systemContent?: string }> = [];
    const adapter = new OpenAiAdapter({
      client: clientReturning(JSON.stringify(validPayload), captured),
      model: 'gpt-5-mini',
    });

    await adapter.generateStructured({
      systemPrompt: 'You are a strategist.',
      userPrompt: 'user',
      schema: collectionDiscoveryProfileSchema,
    });

    assert.match(captured[0]?.systemContent ?? '', /\bjson\b/i);
  });

  it('rejects invalid JSON and invalid schemas', async () => {
    const invalidJson = new OpenAiAdapter({
      client: clientReturning('not-json'),
      model: 'gpt-4o-mini',
    });
    await assert.rejects(
      () =>
        invalidJson.generateStructured({
          systemPrompt: 'system',
          userPrompt: 'user',
          schema: collectionDiscoveryProfileSchema,
        }),
      (error: unknown) =>
        error instanceof LlmGenerationError &&
        error.message === 'OpenAI response was not valid JSON',
    );

    const invalidSchema = new OpenAiAdapter({
      client: clientReturning(JSON.stringify({ topics: [] })),
      model: 'gpt-4o-mini',
    });
    await assert.rejects(
      () =>
        invalidSchema.generateStructured({
          systemPrompt: 'system',
          userPrompt: 'user',
          schema: collectionDiscoveryProfileSchema,
        }),
      (error: unknown) => error instanceof LlmGenerationError,
    );
  });
});
