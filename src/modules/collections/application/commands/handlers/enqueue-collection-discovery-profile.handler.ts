import { enqueueGenerateCollectionDiscoveryProfile } from '../../../../../../packages/queue/src';
import { CollectionAccessService } from '../../services/collection-access.service';
import { EnqueueCollectionDiscoveryProfileCommand } from '../enqueue-collection-discovery-profile.command';

export class EnqueueCollectionDiscoveryProfileHandler {
  constructor(private readonly collectionAccessService: CollectionAccessService) {}

  async execute(
    command: EnqueueCollectionDiscoveryProfileCommand,
  ): Promise<{ jobId: string }> {
    await this.collectionAccessService.requireOwnedCollection(
      command.userId,
      command.collectionId,
    );

    const job = await enqueueGenerateCollectionDiscoveryProfile(
      command.collectionId,
    );
    return { jobId: job.id };
  }
}
