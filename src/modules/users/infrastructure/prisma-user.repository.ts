
import { PrismaClient } from '@prisma/client';
import { User } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';
import { PrismaUserMapper } from './prisma-user.mapper';
import { UpsertUserSaveStrategy } from './user-save.strategies';

export class PrismaUserRepository extends UserRepository {
  private readonly userMapper = new PrismaUserMapper();
  private readonly upsertStrategy = new UpsertUserSaveStrategy();

  constructor(private readonly prisma: PrismaClient) {
    super();
  }

  async get(id: string): Promise<User | null>;
  async get(query: { email: string }): Promise<User | null>;
  async get(
    idOrQuery: string | { email: string },
  ): Promise<User | null> {
    if (typeof idOrQuery === 'string') {
      return this.getById(idOrQuery);
    }
    return this.getByEmail(idOrQuery.email);
  }

  async save(entity: User): Promise<User> {
    return this.upsertStrategy.execute({
      prisma: this.prisma,
      mapper: this.userMapper,
      entity,
    });
  }

  private async getById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.userMapper.toDomain(row) : null;
  }

  private async getByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    return row ? this.userMapper.toDomain(row) : null;
  }
}
