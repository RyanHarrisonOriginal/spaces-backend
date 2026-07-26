import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Space } from '../../../domain/space.entity';
import {
  SPACE_REPOSITORY,
  SpaceRepository,
} from '../../../domain/space.repository';
import { ListSpacesQuery } from '../list-spaces.query';

@QueryHandler(ListSpacesQuery)
export class ListSpacesHandler implements IQueryHandler<ListSpacesQuery> {
  constructor(
    @Inject(SPACE_REPOSITORY)
    private readonly spaces: SpaceRepository,
  ) {}

  async execute(query: ListSpacesQuery): Promise<Space[]> {
    return this.spaces.findByUserId(query.userId);
  }
}
