import { Router } from 'express';

import { createCollectionsRouter } from '../modules/collections/presentation/collections.router';
import { createContentRouter } from '../modules/content/presentation/content.router';
import { createSourcesRouter } from '../modules/sources/presentation/sources.router';
import { createSpacesRouter } from '../modules/spaces/presentation/spaces.router';
import { createUsersRouter } from '../modules/users/presentation/users.router';
import { createHealthRouter } from '../shared/presentation/health.router';
import type { AppContainer } from './container';

export function createApiRouter(container: AppContainer): Router {
  const api = Router();

  api.use(createHealthRouter());
  api.use(createUsersRouter(container));
  api.use(createSourcesRouter(container));
  api.use(createSpacesRouter(container));
  api.use(createCollectionsRouter(container));
  api.use(createContentRouter(container));

  return api;
}
