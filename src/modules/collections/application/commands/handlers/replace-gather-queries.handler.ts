import { randomUUID } from 'crypto';

import {
  GatherQuery,
  GatherQueryRepository,
  GatherQuerySaveStrategy,
} from '../../../../../../packages/persistence/src';
import { ValidationException } from '../../../../../shared/domain/exceptions';
import { CollectionAccessService } from '../../services/collection-access.service';
import { ReplaceGatherQueriesCommand } from '../replace-gather-queries.command';

export class ReplaceGatherQueriesHandler {
  constructor(
    private readonly gatherQueryRepo: GatherQueryRepository,
    private readonly collectionAccessService: CollectionAccessService,
  ) {}

  async execute(command: ReplaceGatherQueriesCommand): Promise<GatherQuery[]> {
    await this.collectionAccessService.requireOwnedCollection(
      command.userId,
      command.collectionId,
    );

    try {
      const entities = command.queries.map((query) =>
        GatherQuery.create({
          id: randomUUID(),
          collectionId: command.collectionId,
          query,
        }),
      );
      return this.gatherQueryRepo.save(
        { collectionId: command.collectionId, items: entities },
        GatherQuerySaveStrategy.Replace,
      );
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid gather queries',
      );
    }
  }
}
