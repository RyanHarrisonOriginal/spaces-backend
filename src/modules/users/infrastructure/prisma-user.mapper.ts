import { User as PrismaUser } from '@prisma/client';

import { ThemeMode, User } from '../domain/user.entity';

export class PrismaUserMapper {
  toDomain(row: PrismaUser): User {
    return User.reconstitute({
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      themeMode: row.themeMode as ThemeMode,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  toCreateData(entity: User) {
    return {
      id: entity.id,
      email: entity.email,
      displayName: entity.displayName,
      themeMode: entity.themeMode,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toUpdateData(entity: User) {
    return {
      email: entity.email,
      displayName: entity.displayName,
      themeMode: entity.themeMode,
      updatedAt: entity.updatedAt,
    };
  }
}
