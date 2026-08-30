import { PrismaClient } from '@prisma/client';
import { SaveStrategy } from '../../../shared/domain/repository';
import { User } from '../domain/user.entity';
import { PrismaUserMapper } from './prisma-user.mapper';

export type UserSaveContext = {
  prisma: PrismaClient;
  mapper: PrismaUserMapper;
  entity: User;
};

export class UpsertUserSaveStrategy
  implements SaveStrategy<UserSaveContext, User>
{
  async execute({ prisma, mapper, entity }: UserSaveContext): Promise<User> {
    const row = await prisma.user.upsert({
      where: { id: entity.id },
      create: mapper.toCreateData(entity),
      update: mapper.toUpdateData(entity),
    });
    return mapper.toDomain(row);
  }
}
