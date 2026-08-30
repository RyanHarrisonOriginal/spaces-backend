import { collectionDiscoveryProfileSchema } from '../../domain/collection-discovery-profile';
import { CollectionDiscoveryProfileMapper } from '../../domain/collection-discovery-profile.mapper';
import {
  CollectionDiscoveryProfileRepository,
  PersistedCollectionDiscoveryProfile,
} from '../../domain/collection-discovery-profile.repository';
import { LlmProvider } from '../ports/llm-provider.port';
import {
  buildCollectionDiscoveryProfileUserPrompt,
  COLLECTION_DISCOVERY_PROFILE_PROMPT_VERSION,
  COLLECTION_DISCOVERY_PROFILE_SYSTEM_PROMPT,
} from '../prompts/collection-discovery-profile.prompt';

export type GenerateCollectionDiscoveryProfileInput = {
  collectionId: string;
  collectionDescription: string;
  spaceDescription: string;
};

export class CollectionDiscoveryProfileService {
  constructor(
    private readonly llmProvider: LlmProvider,
    private readonly profiles: CollectionDiscoveryProfileRepository,
    private readonly mapper = new CollectionDiscoveryProfileMapper(),
  ) {}

  async generateAndPersist(
    input: GenerateCollectionDiscoveryProfileInput,
  ): Promise<PersistedCollectionDiscoveryProfile> {
    const generated = await this.llmProvider.generateStructured({
      systemPrompt: COLLECTION_DISCOVERY_PROFILE_SYSTEM_PROMPT,
      userPrompt: buildCollectionDiscoveryProfileUserPrompt(input),
      schema: collectionDiscoveryProfileSchema,
    });

    const profile = collectionDiscoveryProfileSchema.parse(generated.data);
    const current = await this.profiles.get(input.collectionId);
    const next = this.mapper.toNewActiveVersion({
      current,
      collectionId: input.collectionId,
      profile,
      provider: generated.provider,
      model: generated.model,
      promptVersion: COLLECTION_DISCOVERY_PROFILE_PROMPT_VERSION,
    });

    return this.profiles.save(next);
  }
}
