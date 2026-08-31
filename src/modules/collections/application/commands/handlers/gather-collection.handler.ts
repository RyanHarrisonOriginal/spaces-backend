import { enqueueGatherCollection } from '../../../../../../packages/queue/src';
import { CollectionAccessService } from '../../services/collection-access.service';
import { GatherCollectionCommand } from '../gather-collection.command';

export class GatherCollectionHandler {
  constructor(
    private readonly collectionAccessService: CollectionAccessService,
    private readonly enqueue: (
      collectionId: string,
    ) => Promise<{ id: string }> = enqueueGatherCollection,
  ) {}

  async execute(
    command: GatherCollectionCommand,
  ): Promise<{ jobId: string }> {
    await this.collectionAccessService.requireOwnedCollection(
      command.userId,
      command.collectionId,
    );

    const job = await this.enqueue(command.collectionId);
    return { jobId: job.id };
  }
}
