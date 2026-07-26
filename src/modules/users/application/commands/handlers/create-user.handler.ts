import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';

import { ConflictException } from '../../../../../shared/domain/exceptions';
import { User } from '../../../domain/user.entity';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../../domain/user.repository';
import { CreateUserCommand } from '../create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const existing = await this.users.findByEmail(command.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = User.create({
      id: randomUUID(),
      email: command.email,
      displayName: command.displayName,
      themeMode: command.themeMode,
    });

    return this.users.save(user);
  }
}
