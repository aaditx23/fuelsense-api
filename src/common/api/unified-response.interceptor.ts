import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { UnifiedResponse, ok } from './unified-response';

@Injectable()
export class UnifiedResponseInterceptor<T>
  implements NestInterceptor<T, UnifiedResponse<T>>
{
  intercept(_: ExecutionContext, next: CallHandler): Observable<UnifiedResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        if (
          payload &&
          typeof payload === 'object' &&
          'success' in (payload as Record<string, unknown>)
        ) {
          return payload as UnifiedResponse<T>;
        }

        if (Array.isArray(payload)) {
          return ok({ message: 'Operation successful', listData: payload });
        }

        return ok({ message: 'Operation successful', data: (payload as T) ?? null });
      }),
    );
  }
}
