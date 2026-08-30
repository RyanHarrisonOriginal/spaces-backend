
import { Space } from '../../../domain/space.entity';
import {
  SpaceRepository,
} from '../../../domain/space.repository';
import { ListSpacesQuery } from '../list-spaces.query';

export class ListSpacesHandler {
  constructor(
    private readonly spaces: SpaceRepository,
  ) {}

  async execute(query: ListSpacesQuery): Promise<Space[]> {
    return this.spaces.get({ userId: query.userId });
  }
}
