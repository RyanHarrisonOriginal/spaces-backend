import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { BootstrapUserCommand } from '../application/commands/bootstrap-user.command';
import { CreateUserCommand } from '../application/commands/create-user.command';
import { UpdateUserCommand } from '../application/commands/update-user.command';
import { CreateUserDto } from '../application/dto/create-user.dto';
import { UpdateUserDto } from '../application/dto/update-user.dto';
import { GetUserQuery } from '../application/queries/get-user.query';
import { User } from '../domain/user.entity';

@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<User> {
    return this.commandBus.execute(
      new CreateUserCommand(dto.email, dto.displayName, dto.themeMode),
    );
  }

  /** Find-or-create for app first launch (no auth yet). */
  @Post('bootstrap')
  async bootstrap(@Body() dto: CreateUserDto): Promise<User> {
    return this.commandBus.execute(
      new BootstrapUserCommand(dto.email, dto.displayName, dto.themeMode),
    );
  }

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.queryBus.execute(new GetUserQuery(id));
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.commandBus.execute(
      new UpdateUserCommand(id, dto.displayName, dto.themeMode),
    );
  }
}
