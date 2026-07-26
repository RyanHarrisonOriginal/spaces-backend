import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Resolves the acting user from `x-user-id` (early auth stand-in).
 */
export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const userId = request.header('x-user-id');
    if (!userId) {
      throw new BadRequestException('Missing required header: x-user-id');
    }
    return userId;
  },
);
