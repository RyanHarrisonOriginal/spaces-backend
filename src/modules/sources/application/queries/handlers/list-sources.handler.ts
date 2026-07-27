import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { Source } from '../../../domain/source.entity';
import {
  SOURCE_REPOSITORY,
  SourceRepository,
} from '../../../domain/source.repository';
import { ListSourcesQuery } from '../list-sources.query';

@QueryHandler(ListSourcesQuery)
export class ListSourcesHandler implements IQueryHandler<ListSourcesQuery> {
  constructor(
    @Inject(SOURCE_REPOSITORY)
    private readonly sources: SourceRepository,
  ) {}

  async execute(_query: ListSourcesQuery): Promise<Source[]> {
    return this.sources.findAllActive();
  }
}
