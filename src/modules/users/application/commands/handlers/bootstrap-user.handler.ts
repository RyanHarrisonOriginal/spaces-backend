import { randomUUID } from 'crypto';

import { User } from '../../../domain/user.entity';
import {
  UserRepository,
} from '../../../domain/user.repository';
import { BootstrapUserCommand } from '../bootstrap-user.command';

export class BootstrapUserHandler {
  constructor(
    private readonly users: UserRepository,
  ) {}

  async execute(command: BootstrapUserCommand): Promise<User> {
    const existing = await this.users.get({ email: command.email });
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
