import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

/**
 * Lets only the scheduler in. Vercel Cron sends `Authorization: Bearer
 * <CRON_SECRET>` when the CRON_SECRET environment variable is set; with it
 * unset nothing gets through, so a forgotten variable closes the endpoint
 * rather than opening it.
 */
@Injectable()
export class CronSecretGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) {
      throw new ForbiddenException('Scheduled jobs are not enabled');
    }

    const header = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined> }>()
      .headers['authorization'];

    const expected = Buffer.from(`Bearer ${secret}`);
    const received = Buffer.from(header ?? '');
    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      throw new ForbiddenException('Forbidden resource');
    }

    return true;
  }
}
