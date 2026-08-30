
import { NotFoundException } from '../../../../../shared/domain/exceptions';
import { User } from '../../../domain/user.entity';
import {
  UserRepository,
} from '../../../domain/user.repository';
import { UpdateUserCommand } from '../update-user.command';

export class UpdateUserHandler {
  constructor(
    private readonly userRepo: UserRepository,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const user = await this.userRepo.get(command.userId);
    if (!user) {
      throw new NotFoundException('User', command.userId);
    }

    user.update({
      displayName: command.displayName,
      themeMode: command.themeMode,
    });

    return this.userRepo.save(user);
  }
}
