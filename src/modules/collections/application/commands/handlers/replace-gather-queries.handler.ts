import { randomUUID } from 'crypto';

import { ValidationException } from '../../../../../shared/domain/exceptions';
import { CollectionAccessService } from '../../services/collection-access.service';
import { GatherQuery } from '../../../domain/gather-query.entity';
import {
  GatherQueryRepository,
  GatherQuerySave,
} from '../../../domain/gather-query.repository';
import { ReplaceGatherQueriesCommand } from '../replace-gather-queries.command';

export class ReplaceGatherQueriesHandler {
  constructor(
    private readonly gatherQueries: GatherQueryRepository,
    private readonly access: CollectionAccessService,
  ) {}

  async execute(command: ReplaceGatherQueriesCommand): Promise<GatherQuery[]> {
    await this.access.requireOwnedCollection(
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
      return this.gatherQueries.save(
        { collectionId: command.collectionId, items: entities },
        GatherQuerySave.Replace,
      );
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid gather queries',
      );
    }
  }
}
