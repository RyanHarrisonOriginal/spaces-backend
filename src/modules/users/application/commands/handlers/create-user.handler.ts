import { randomUUID } from 'crypto';

import { ConflictException } from '../../../../../shared/domain/exceptions';
import { User } from '../../../domain/user.entity';
import {
  UserRepository,
} from '../../../domain/user.repository';
import { CreateUserCommand } from '../create-user.command';

export class CreateUserHandler {
  constructor(
    private readonly users: UserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const existing = await this.users.get({ email: command.email });
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
