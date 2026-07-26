import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CollectionsModule } from './modules/collections/collections.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { ThingsModule } from './modules/things/things.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';
import { HealthController } from './shared/presentation/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    SpacesModule,
    CollectionsModule,
    ThingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
