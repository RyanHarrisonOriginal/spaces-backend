import { Router } from 'express';

import type { AppContainer } from '../../../http/container';
import { asyncHandler } from '../../../http/async-handler';
import { mount } from '../../../http/mount';
import { requireUserId } from '../../../http/require-user-id';
import { requireUuidParam, routeParam } from '../../../http/require-uuid-param';
import { send } from '../../../http/send';
import { validateBody } from '../../../http/validate-body';
import { CreateSpaceCommand } from '../application/commands/create-space.command';
import { DeleteSpaceCommand } from '../application/commands/delete-space.command';
import { UpdateSpaceCommand } from '../application/commands/update-space.command';
import { CreateSpaceDto } from '../application/dto/create-space.dto';
import { UpdateSpaceDto } from '../application/dto/update-space.dto';
import { GetSpaceTreeQuery } from '../application/queries/get-space-tree.query';
import { ListSpacesQuery } from '../application/queries/list-spaces.query';
import { SpaceRoutes } from './spaces.routes';

export function createSpacesRouter(container: AppContainer): Router {
  const router = Router();

  mount(
    router,
    SpaceRoutes.list,
    requireUserId,
    asyncHandler(async (req, res) => {
      const result = await container.listSpaces.execute(
        new ListSpacesQuery(req.userId!),
      );
      send(res, SpaceRoutes.list.status, result);
    }),
  );

  mount(
    router,
    SpaceRoutes.create,
    requireUserId,
    validateBody(CreateSpaceDto),
    asyncHandler(async (req, res) => {
      const result = await container.createSpace.execute(
        new CreateSpaceCommand(
          req.userId!,
          req.body.name,
          req.body.description,
          req.body.accent,
          req.body.headerFont,
          req.body.bgColor,
          req.body.textColor,
          req.body.view,
        ),
      );
      send(res, SpaceRoutes.create.status, result);
    }),
  );

  mount(
    router,
    SpaceRoutes.getTree,
    requireUserId,
    requireUuidParam('spaceId'),
    asyncHandler(async (req, res) => {
      const result = await container.getSpaceTree.execute(
        new GetSpaceTreeQuery(req.userId!, routeParam(req, 'spaceId')),
      );
      send(res, SpaceRoutes.getTree.status, result);
    }),
  );

  mount(
    router,
    SpaceRoutes.update,
    requireUserId,
    requireUuidParam('spaceId'),
    validateBody(UpdateSpaceDto),
    asyncHandler(async (req, res) => {
      const result = await container.updateSpace.execute(
        new UpdateSpaceCommand(req.userId!, routeParam(req, 'spaceId'), req.body),
      );
      send(res, SpaceRoutes.update.status, result);
    }),
  );

  mount(
    router,
    SpaceRoutes.remove,
    requireUserId,
    requireUuidParam('spaceId'),
    asyncHandler(async (req, res) => {
      await container.deleteSpace.execute(
        new DeleteSpaceCommand(req.userId!, routeParam(req, 'spaceId')),
      );
      send(res, SpaceRoutes.remove.status);
    }),
  );

  return router;
}
