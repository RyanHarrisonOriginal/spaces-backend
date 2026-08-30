
import { Space } from '../../../domain/space.entity';
import {
  SpaceRepository,
} from '../../../domain/space.repository';
import { ListSpacesQuery } from '../list-spaces.query';

export class ListSpacesHandler {
  constructor(
    private readonly spaceRepo: SpaceRepository,
  ) {}

  async execute(query: ListSpacesQuery): Promise<Space[]> {
    return this.spaceRepo.get({ userId: query.userId });
  }
}
