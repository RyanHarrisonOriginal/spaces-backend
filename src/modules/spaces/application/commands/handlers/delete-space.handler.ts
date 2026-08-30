
import { NotFoundException } from '../../../../../shared/domain/exceptions';
import {
  SpaceRepository,
  SpaceSave,
} from '../../../domain/space.repository';
import { DeleteSpaceCommand } from '../delete-space.command';

export class DeleteSpaceHandler {
  constructor(
    private readonly spaces: SpaceRepository,
  ) {}

  async execute(command: DeleteSpaceCommand): Promise<void> {
    const space = await this.spaces.get(command.spaceId);
    if (!space || space.userId !== command.userId) {
      throw new NotFoundException('Space', command.spaceId);
    }
    await this.spaces.save(space, SpaceSave.Delete);
  }
}
