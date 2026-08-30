import type { Response } from 'express';

export function send(res: Response, status: number, body?: unknown): void {
  if (status === 204) {
    res.status(204).end();
    return;
  }
  res.status(status).json(body);
}
