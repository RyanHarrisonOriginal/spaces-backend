import { Injectable } from '@nestjs/common';
import { User as PrismaUser } from '@prisma/client';

import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { ThemeMode, User } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(entity: User): Promise<User> {
    const row = await this.prisma.user.upsert({
      where: { id: entity.id },
      create: {
        id: entity.id,
        email: entity.email,
        displayName: entity.displayName,
        themeMode: entity.themeMode,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
      },
      update: {
        email: entity.email,
        displayName: entity.displayName,
        themeMode: entity.themeMode,
        updatedAt: entity.updatedAt,
      },
    });
    return this.toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  private toDomain(row: PrismaUser): User {
    return User.reconstitute({
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      themeMode: row.themeMode as ThemeMode,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
