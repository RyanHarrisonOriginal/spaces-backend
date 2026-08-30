import { randomUUID } from 'crypto';

import {
  NotFoundException,
  ValidationException,
} from '../../../../../shared/domain/exceptions';
import {
  UserRepository,
} from '../../../../users/domain/user.repository';
import { Space } from '../../../domain/space.entity';
import {
  SpaceRepository,
} from '../../../domain/space.repository';
import { CreateSpaceCommand } from '../create-space.command';

export class CreateSpaceHandler {
  constructor(
    private readonly spaces: SpaceRepository,
    private readonly users: UserRepository,
  ) {}

  async execute(command: CreateSpaceCommand): Promise<Space> {
    const user = await this.users.get(command.userId);
    if (!user) {
      throw new NotFoundException('User', command.userId);
    }

    try {
      const space = Space.create({
        id: randomUUID(),
        userId: command.userId,
        name: command.name,
        description: command.description,
        accent: command.accent,
        headerFont: command.headerFont,
        bgColor: command.bgColor,
        textColor: command.textColor,
        view: command.view,
      });
      return this.spaces.save(space);
    } catch (error) {
      throw new ValidationException(
        error instanceof Error ? error.message : 'Invalid space',
      );
    }
  }
}
