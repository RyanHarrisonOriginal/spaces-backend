import type { NextFunction, Request, Response } from 'express';

import {
  ConflictException,
  DomainException,
  NotFoundException,
  ValidationException,
} from '../shared/domain/exceptions';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      statusCode: 400,
      error: 'BadRequest',
      message: 'Invalid JSON body',
    });
    return;
  }
  if (error instanceof NotFoundException) {
    res.status(404).json({
      statusCode: 404,
      error: error.name,
      message: error.message,
    });
    return;
  }
  if (error instanceof ConflictException) {
    res.status(409).json({
      statusCode: 409,
      error: error.name,
      message: error.message,
    });
    return;
  }
  if (error instanceof ValidationException) {
    res.status(422).json({
      statusCode: 422,
      error: error.name,
      message: error.message,
    });
    return;
  }
  if (error instanceof DomainException) {
    res.status(400).json({
      statusCode: 400,
      error: error.name,
      message: error.message,
    });
    return;
  }

  const message =
    error instanceof Error ? error.message : 'Internal server error';
  res.status(500).json({
    statusCode: 500,
    error: 'InternalServerError',
    message,
  });
}
