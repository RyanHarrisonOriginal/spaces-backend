import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { ListSourcesQuery } from '../application/queries/list-sources.query';
import { Source } from '../domain/source.entity';

@Controller('sources')
export class SourcesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  async list(): Promise<Source[]> {
    return this.queryBus.execute(new ListSourcesQuery());
  }
}
