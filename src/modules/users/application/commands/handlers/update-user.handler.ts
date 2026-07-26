import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { NotFoundException } from '../../../../../shared/domain/exceptions';
import { User } from '../../../domain/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../domain/user.repository';
import { UpdateUserCommand } from '../update-user.command';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const user = await this.users.findById(command.userId);
    if (!user) {
      throw new NotFoundException('User', command.userId);
    }

    user.update({
      displayName: command.displayName,
      themeMode: command.themeMode,
    });

    return this.users.save(user);
  }
}
