import { Repository } from '../../../shared/domain/repository';
import { GatherQuery } from './gather-query.entity';

export abstract class GatherQueryRepository extends Repository<GatherQuery> {
  abstract findByThingId(thingId: string): Promise<GatherQuery[]>;
  abstract replaceForThing(
    thingId: string,
    queries: GatherQuery[],
  ): Promise<GatherQuery[]>;
}

export const GATHER_QUERY_REPOSITORY = Symbol('GATHER_QUERY_REPOSITORY');
