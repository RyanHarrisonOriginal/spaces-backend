import { Router } from 'express';

import type { AppContainer } from '../../../http/container';
import { asyncHandler } from '../../../http/async-handler';
import { mount } from '../../../http/mount';
import { requireUuidParam, routeParam } from '../../../http/require-uuid-param';
import { send } from '../../../http/send';
import { validateBody } from '../../../http/validate-body';
import { BootstrapUserCommand } from '../application/commands/bootstrap-user.command';
import { CreateUserCommand } from '../application/commands/create-user.command';
import { UpdateUserCommand } from '../application/commands/update-user.command';
import { CreateUserDto } from '../application/dto/create-user.dto';
import { UpdateUserDto } from '../application/dto/update-user.dto';
import { GetUserQuery } from '../application/queries/get-user.query';
import { UserRoutes } from './users.routes';

export function createUsersRouter(container: AppContainer): Router {
  const router = Router();

  mount(
    router,
    UserRoutes.create,
    validateBody(CreateUserDto),
    asyncHandler(async (req, res) => {
      const result = await container.createUser.execute(
        new CreateUserCommand(req.body.email, req.body.displayName, req.body.themeMode),
      );
      send(res, UserRoutes.create.status, result);
    }),
  );

  mount(
    router,
    UserRoutes.bootstrap,
    validateBody(CreateUserDto),
    asyncHandler(async (req, res) => {
      const result = await container.bootstrapUser.execute(
        new BootstrapUserCommand(
          req.body.email,
          req.body.displayName,
          req.body.themeMode,
        ),
      );
      send(res, UserRoutes.bootstrap.status, result);
    }),
  );

  mount(
    router,
    UserRoutes.getById,
    requireUuidParam('id'),
    asyncHandler(async (req, res) => {
      const result = await container.getUser.execute(
        new GetUserQuery(routeParam(req, 'id')),
      );
      send(res, UserRoutes.getById.status, result);
    }),
  );

  mount(
    router,
    UserRoutes.update,
    requireUuidParam('id'),
    validateBody(UpdateUserDto),
    asyncHandler(async (req, res) => {
      const result = await container.updateUser.execute(
        new UpdateUserCommand(
          routeParam(req, 'id'),
          req.body.displayName,
          req.body.themeMode,
        ),
      );
      send(res, UserRoutes.update.status, result);
    }),
  );

  return router;
}
