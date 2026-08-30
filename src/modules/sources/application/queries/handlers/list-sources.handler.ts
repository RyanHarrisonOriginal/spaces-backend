import { Source } from '../../../domain/source.entity';
import {
  SourceRepository,
} from '../../../domain/source.repository';
import { ListSourcesQuery } from '../list-sources.query';

export class ListSourcesHandler {
  constructor(
    private readonly sources: SourceRepository,
  ) {}

  async execute(_query: ListSourcesQuery): Promise<Source[]> {
    return this.sources.get({ active: true });
  }
}
