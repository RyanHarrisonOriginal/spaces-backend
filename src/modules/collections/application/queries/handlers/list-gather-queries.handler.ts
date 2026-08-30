import {
  GatherQuery,
  GatherQueryRepository,
} from '../../../../../../packages/persistence/src';
import { CollectionAccessService } from '../../services/collection-access.service';
import { ListGatherQueriesQuery } from '../list-gather-queries.query';

export class ListGatherQueriesHandler {
  constructor(
    private readonly gatherQueryRepo: GatherQueryRepository,
    private readonly collectionAccessService: CollectionAccessService,
  ) {}

  async execute(query: ListGatherQueriesQuery): Promise<GatherQuery[]> {
    await this.collectionAccessService.requireOwnedCollection(query.userId, query.collectionId);
    return this.gatherQueryRepo.get({ collectionId: query.collectionId });
  }
}
