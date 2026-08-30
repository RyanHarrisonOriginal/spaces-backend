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

function clientReturning(content: string | null): OpenAiChatClient {
  return {
    chat: {
      completions: {
        async create() {
          return {
            model: 'gpt-4o-mini',
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
