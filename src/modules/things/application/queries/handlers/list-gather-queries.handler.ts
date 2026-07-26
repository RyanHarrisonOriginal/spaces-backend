import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { GatherQuery } from '../../../domain/gather-query.entity';
import {
  GATHER_QUERY_REPOSITORY,
  GatherQueryRepository,
} from '../../../domain/gather-query.repository';
import { ThingAccessService } from '../../services/thing-access.service';
import { ListGatherQueriesQuery } from '../list-gather-queries.query';

@QueryHandler(ListGatherQueriesQuery)
export class ListGatherQueriesHandler
  implements IQueryHandler<ListGatherQueriesQuery>
{
  constructor(
    @Inject(GATHER_QUERY_REPOSITORY)
    private readonly gatherQueries: GatherQueryRepository,
    private readonly access: ThingAccessService,
  ) {}

  async execute(query: ListGatherQueriesQuery): Promise<GatherQuery[]> {
    await this.access.requireOwnedThing(query.userId, query.thingId);
    return this.gatherQueries.findByThingId(query.thingId);
  }
}
