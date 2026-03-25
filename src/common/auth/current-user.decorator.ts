import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthUser = {
  userId: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
};

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser | null => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    return request.user ?? null;
  },
);
