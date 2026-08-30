import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { NextFunction, Request, Response } from 'express';

type DtoClass<T extends object> = new () => T;

export function validateBody<T extends object>(Dto: DtoClass<T>) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const instance = plainToInstance(Dto, req.body, {
      enableImplicitConversion: true,
    });
    const errors = await validate(instance, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    if (errors.length) {
      res.status(400).json({
        statusCode: 400,
        error: 'BadRequest',
        message: errors
          .flatMap((error) => Object.values(error.constraints ?? {}))
          .join('; '),
      });
      return;
    }
    req.body = instance;
    next();
  };
}
