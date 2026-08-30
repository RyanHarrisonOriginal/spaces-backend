import { Router } from 'express';

import { createCollectionsRouter } from '../modules/collections/presentation/collections.router';
import { createSpacesRouter } from '../modules/spaces/presentation/spaces.router';
import { createUsersRouter } from '../modules/users/presentation/users.router';
import { createHealthRouter } from '../shared/presentation/health.router';
import type { AppContainer } from './container';

export function createApiRouter(container: AppContainer): Router {
  const api = Router();

  api.use(createHealthRouter());
  api.use(createUsersRouter(container));
  api.use(createSpacesRouter(container));
  api.use(createCollectionsRouter(container));

  return api;
}
