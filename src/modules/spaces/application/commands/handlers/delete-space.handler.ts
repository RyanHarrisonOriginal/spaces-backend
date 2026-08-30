
import { NotFoundException } from '../../../../../shared/domain/exceptions';
import {
  SpaceRepository,
  SpaceSaveStrategy,
} from '../../../domain/space.repository';
import { DeleteSpaceCommand } from '../delete-space.command';

export class DeleteSpaceHandler {
  constructor(
    private readonly spaceRepo: SpaceRepository,
  ) {}

  async execute(command: DeleteSpaceCommand): Promise<void> {
    const space = await this.spaceRepo.get(command.spaceId);
    if (!space || space.userId !== command.userId) {
      throw new NotFoundException('Space', command.spaceId);
    }
    await this.spaceRepo.save(space, SpaceSaveStrategy.Delete);
  }
}
