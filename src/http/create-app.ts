import cors from 'cors';
import express, { type Express } from 'express';

import { createContainer, type AppContainer } from './container';
import { errorHandler } from './error-handler';
import { createApiRouter } from './router';

export function createApp(
  container: AppContainer = createContainer(),
): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api', createApiRouter(container));
  app.use((req, res) => {
    res.status(404).json({
      statusCode: 404,
      error: 'NotFound',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    });
  });
  app.use(errorHandler);
  return app;
}
