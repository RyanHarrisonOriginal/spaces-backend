
import { CollectionAccessService } from '../../services/collection-access.service';
import { GatherQuery } from '../../../domain/gather-query.entity';
import {
  GatherQueryRepository,
} from '../../../domain/gather-query.repository';
import { ListGatherQueriesQuery } from '../list-gather-queries.query';

export class ListGatherQueriesHandler {
  constructor(
    private readonly gatherQueries: GatherQueryRepository,
    private readonly access: CollectionAccessService,
  ) {}

  async execute(query: ListGatherQueriesQuery): Promise<GatherQuery[]> {
    await this.access.requireOwnedCollection(query.userId, query.collectionId);
    return this.gatherQueries.get({ collectionId: query.collectionId });
  }
}
