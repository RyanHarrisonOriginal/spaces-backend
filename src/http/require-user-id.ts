import type { NextFunction, Request, Response } from 'express';

export function requireUserId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = req.header('x-user-id');
  if (!userId) {
    res.status(400).json({
      statusCode: 400,
      error: 'BadRequest',
      message: 'Missing required header: x-user-id',
    });
    return;
  }
  req.userId = userId;
  next();
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
