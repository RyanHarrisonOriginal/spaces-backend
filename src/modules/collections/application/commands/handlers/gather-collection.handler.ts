import { enqueueGatherCollection } from '../../../../../../packages/queue/src';
import { CollectionAccessService } from '../../services/collection-access.service';
import { GatherCollectionCommand } from '../gather-collection.command';

export class GatherCollectionHandler {
  constructor(private readonly collectionAccessService: CollectionAccessService) {}

  async execute(
    command: GatherCollectionCommand,
  ): Promise<{ jobId: string }> {
    await this.collectionAccessService.requireOwnedCollection(
      command.userId,
      command.collectionId,
    );

    const job = await enqueueGatherCollection(command.collectionId);
    return { jobId: job.id };
  }
}
