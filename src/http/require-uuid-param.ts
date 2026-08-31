import type { NextFunction, Request, Response } from 'express';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function routeParam(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export function requireUuidParam(name: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = routeParam(req, name);
    if (!value || !UUID_RE.test(value)) {
      res.status(400).json({
        statusCode: 400,
        error: 'BadRequest',
        message: `Invalid UUID parameter: ${name}`,
      });
      return;
    }
    next();
  };
}

const JOB_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export function requireJobIdParam(name: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = routeParam(req, name);
    if (!value || !JOB_ID_RE.test(value)) {
      res.status(400).json({
        statusCode: 400,
        error: 'BadRequest',
        message: `Invalid job id parameter: ${name}`,
      });
      return;
    }
    next();
  };
}
