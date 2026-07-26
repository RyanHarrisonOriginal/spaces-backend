import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Thing } from '../../../domain/thing.entity';
import { ThingAccessService } from '../../services/thing-access.service';
import { GetThingQuery } from '../get-thing.query';

@QueryHandler(GetThingQuery)
export class GetThingHandler implements IQueryHandler<GetThingQuery> {
  constructor(private readonly access: ThingAccessService) {}

  async execute(query: GetThingQuery): Promise<Thing> {
    return this.access.requireOwnedThing(query.userId, query.thingId);
  }
}
