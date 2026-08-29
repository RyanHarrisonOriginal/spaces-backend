import {
  SpaceDiscoveryProfile,
  spaceDiscoveryProfileSchema,
} from '../../types/src';

export type SpaceForDiscovery = {
  id: string;
  name: string;
  description: string;
};

export type ProfileGenerator = (
  space: SpaceForDiscovery,
) => Promise<unknown>;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3);
}

export async function generateHeuristicProfile(
  space: SpaceForDiscovery,
): Promise<SpaceDiscoveryProfile> {
  const words = [
    ...new Set(tokenize(`${space.name} ${space.description}`)),
  ].slice(0, 8);
  const topics = words.length > 0 ? words : [space.name.trim() || 'general'];

  return spaceDiscoveryProfileSchema.parse({
    topics,
    searchQueries: [
      `${space.name} tutorial`,
      `best ${space.name.toLowerCase()} guide`,
      `${space.name} explained`,
    ],
    positiveSignals: topics,
    negativeSignals: ['clickbait', 'unrelated vlog', 'spam compilation'],
    contentPreferences: {
      formats: ['video', 'article'],
      skillLevel: 'beginner',
    },
  });
}

export async function generateOpenAiProfile(
  space: SpaceForDiscovery,
): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You generate structured discovery profiles for a learning space. Reply with JSON only using keys: topics (string[]), searchQueries (string[]), positiveSignals (string[]), negativeSignals (string[]), and optional contentPreferences { formats?, skillLevel?, minDurationMinutes?, maxDurationMinutes? }. Keep lists short and specific.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            name: space.name,
            description: space.description,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI response did not include message content');
  }

  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new Error('OpenAI response was not valid JSON');
  }
}

export function createProfileGenerator(): ProfileGenerator {
  if (process.env.OPENAI_API_KEY) {
    return generateOpenAiProfile;
  }
  return generateHeuristicProfile;
}

export async function generateSpaceDiscoveryProfile(
  space: SpaceForDiscovery,
  generate: ProfileGenerator = createProfileGenerator(),
): Promise<SpaceDiscoveryProfile> {
  const raw = await generate(space);
  return spaceDiscoveryProfileSchema.parse(raw);
}
