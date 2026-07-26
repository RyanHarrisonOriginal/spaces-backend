import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';

import { ValidationException } from '../../../../../shared/domain/exceptions';
import { GatherQuery } from '../../../domain/gather-query.entity';
import {
  GATHER_QUERY_REPOSITORY,
  GatherQueryRepository,
} from '../../../domain/gather-query.repository';
import { ThingAccessService } from '../../services/thing-access.service';
import { ReplaceGatherQueriesCommand } from '../replace-gather-queries.command';

@CommandHandler(ReplaceGatherQueriesCommand)
export class ReplaceGatherQueriesHandler
  implements ICommandHandler<ReplaceGatherQueriesCommand>
{
  constructor(
    @Inject(GATHER_QUERY_REPOSITORY)
    private readonly gatherQueries: GatherQueryRepository,
    private readonly access: ThingAccessService,
  ) {}

  async execute(command: ReplaceGatherQueriesCommand): Promise<GatherQuery[]> {
    await this.access.requireOwnedThing(command.userId, command.thingId);

    try {
      const entities = command.queries.map((query) =>
        GatherQuery.create({
          id: randomUUID(),
          thingId: command.thingId,
          query,
        }),
      );
      return this.gatherQueries.replaceForThing(command.thingId, entities);
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid gather queries',
      );
    }
  }
}
