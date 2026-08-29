import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { CollectionAccessService } from '../../services/collection-access.service';
import { GatherQuery } from '../../../domain/gather-query.entity';
import {
  GATHER_QUERY_REPOSITORY,
  GatherQueryRepository,
} from '../../../domain/gather-query.repository';
import { ListGatherQueriesQuery } from '../list-gather-queries.query';

@QueryHandler(ListGatherQueriesQuery)
export class ListGatherQueriesHandler
  implements IQueryHandler<ListGatherQueriesQuery>
{
  constructor(
    @Inject(GATHER_QUERY_REPOSITORY)
    private readonly gatherQueries: GatherQueryRepository,
    private readonly access: CollectionAccessService,
  ) {}

  async execute(query: ListGatherQueriesQuery): Promise<GatherQuery[]> {
    await this.access.requireOwnedCollection(query.userId, query.collectionId);
    return this.gatherQueries.findByCollectionId(query.collectionId);
  }
}
