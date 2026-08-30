import type { HttpRoute } from '../../../http/http-route';

export const SourceRoutes = {
  list: { method: 'get', path: '/sources', status: 200 },
} as const satisfies Record<string, HttpRoute>;
