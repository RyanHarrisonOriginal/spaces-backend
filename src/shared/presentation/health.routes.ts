import type { HttpRoute } from '../../http/http-route';

export const HealthRoutes = {
  check: { method: 'get', path: '/health', status: 200 },
} as const satisfies Record<string, HttpRoute>;
