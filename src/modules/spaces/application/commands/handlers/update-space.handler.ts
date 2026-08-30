
import {
  NotFoundException,
  ValidationException,
} from '../../../../../shared/domain/exceptions';
import { Space } from '../../../domain/space.entity';
import {
  SpaceRepository,
} from '../../../domain/space.repository';
import { UpdateSpaceCommand } from '../update-space.command';

export class UpdateSpaceHandler {
  constructor(
    private readonly spaceRepo: SpaceRepository,
  ) {}

  async execute(command: UpdateSpaceCommand): Promise<Space> {
    const space = await this.spaceRepo.get(command.spaceId);
    if (!space || space.userId !== command.userId) {
      throw new NotFoundException('Space', command.spaceId);
    }

    try {
      space.update(command.patch);
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid space update',
      );
    }

    return this.spaceRepo.save(space);
  }
}
