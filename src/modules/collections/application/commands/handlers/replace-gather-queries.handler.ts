import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';

import { ValidationException } from '../../../../../shared/domain/exceptions';
import { CollectionAccessService } from '../../services/collection-access.service';
import { GatherQuery } from '../../../domain/gather-query.entity';
import {
  GATHER_QUERY_REPOSITORY,
  GatherQueryRepository,
} from '../../../domain/gather-query.repository';
import { ReplaceGatherQueriesCommand } from '../replace-gather-queries.command';

@CommandHandler(ReplaceGatherQueriesCommand)
export class ReplaceGatherQueriesHandler
  implements ICommandHandler<ReplaceGatherQueriesCommand>
{
  constructor(
    @Inject(GATHER_QUERY_REPOSITORY)
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
      return this.gatherQueries.replaceForCollection(
        command.collectionId,
        entities,
      );
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid gather queries',
      );
    }
  }
}
