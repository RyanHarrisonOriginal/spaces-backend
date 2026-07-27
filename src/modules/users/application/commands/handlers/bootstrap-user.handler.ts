import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';

import { User } from '../../../domain/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../domain/user.repository';
import { BootstrapUserCommand } from '../bootstrap-user.command';

@CommandHandler(BootstrapUserCommand)
export class BootstrapUserHandler
  implements ICommandHandler<BootstrapUserCommand>
{
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(command: BootstrapUserCommand): Promise<User> {
    const existing = await this.users.findByEmail(command.email);
    if (existing) return existing;

    const user = User.create({
      id: randomUUID(),
      email: command.email,
      displayName: command.displayName,
      themeMode: command.themeMode,
    });

    return this.users.save(user);
  }
}
