import { CollectionAccessService } from '../../services/collection-access.service';
import { GatherCollectionService } from '../../services/gather-collection.service';
import { GatherCollectionCommand } from '../gather-collection.command';
import type { ContentSearchResult } from '../../../../../../packages/discovery/src';

export class GatherCollectionHandler {
  constructor(
    private readonly collectionAccessService: CollectionAccessService,
    private readonly gatherCollectionService: GatherCollectionService,
  ) {}

  async execute(
    command: GatherCollectionCommand,
  ): Promise<{ results: ContentSearchResult[] }> {
    await this.collectionAccessService.requireOwnedCollection(
      command.userId,
      command.collectionId,
    );

    const results = await this.gatherCollectionService.gather(
      command.collectionId,
    );
    return { results };
  }
}
