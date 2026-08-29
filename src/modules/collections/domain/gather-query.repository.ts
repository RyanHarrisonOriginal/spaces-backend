import { Repository } from '../../../shared/domain/repository';
import { GatherQuery } from './gather-query.entity';

export abstract class GatherQueryRepository extends Repository<GatherQuery> {
  abstract findByCollectionId(collectionId: string): Promise<GatherQuery[]>;
  abstract replaceForCollection(
    collectionId: string,
    queries: GatherQuery[],
  ): Promise<GatherQuery[]>;
}

export const GATHER_QUERY_REPOSITORY = Symbol('GATHER_QUERY_REPOSITORY');
