import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const COLLECTION_DISCOVERY_PROFILE_PROMPT_VERSION =
  'collection-discovery-profile.v2';

export const COLLECTION_DISCOVERY_PROFILE_SYSTEM_PROMPT = readPrompt(
  'collection-discovery-profile.system.txt',
);

const userPromptTemplate = readPrompt(
  'collection-discovery-profile.user.txt',
);

export function buildCollectionDiscoveryProfileUserPrompt(input: {
  collectionDescription: string;
  spaceDescription: string;
}): string {
  return userPromptTemplate
    .replaceAll(
      '{{spaceDescription}}',
      input.spaceDescription.trim() || '(none)',
    )
    .replaceAll(
      '{{collectionDescription}}',
      input.collectionDescription.trim(),
    );
}

function readPrompt(fileName: string): string {
  return readFileSync(join(__dirname, fileName), 'utf8').trim();
}
