import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { RelevanceCandidate } from '../ports/content-relevance-evaluator.port';

export const CONTENT_RELEVANCE_PROMPT_VERSION = 'content-relevance.v2';

export const CONTENT_RELEVANCE_SYSTEM_PROMPT = readPrompt(
  'content-relevance.system.txt',
);

const userPromptTemplate = readPrompt('content-relevance.user.txt');

const DESCRIPTION_CHAR_LIMIT = 500;

export function buildContentRelevanceUserPrompt(input: {
  spaceName: string;
  spaceDescription: string;
  collectionName: string;
  collectionDescription: string;
  candidates: RelevanceCandidate[];
}): string {
  return userPromptTemplate
    .replaceAll('{{spaceName}}', input.spaceName.trim() || '(none)')
    .replaceAll(
      '{{spaceDescription}}',
      input.spaceDescription.trim() || '(none)',
    )
    .replaceAll(
      '{{collectionName}}',
      input.collectionName.trim() || '(none)',
    )
    .replaceAll(
      '{{collectionDescription}}',
      input.collectionDescription.trim() || '(none)',
    )
    .replaceAll(
      '{{candidates}}',
      JSON.stringify(input.candidates.map(serializeCandidate), null, 2),
    );
}

function serializeCandidate(candidate: RelevanceCandidate) {
  return {
    externalId: candidate.externalId,
    title: candidate.title,
    description: truncate(candidate.description, DESCRIPTION_CHAR_LIMIT),
    originatingSearchQueries: candidate.discoveredByQueries,
  };
}

function truncate(value: string, limit: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit)}…`;
}

function readPrompt(fileName: string): string {
  return readFileSync(join(__dirname, fileName), 'utf8').trim();
}
