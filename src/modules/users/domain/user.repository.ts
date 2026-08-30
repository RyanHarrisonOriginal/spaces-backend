import { User } from './user.entity';

export abstract class UserRepository {
  abstract get(id: string): Promise<User | null>;
  abstract get(query: { email: string }): Promise<User | null>;
  abstract save(entity: User): Promise<User>;
}

