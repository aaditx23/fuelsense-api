import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (payload: unknown) => void };
    }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const extracted = (exceptionResponse as { message?: string | string[] }).message;
        message = Array.isArray(extracted)
          ? `Validation error: ${extracted[0]}`
          : (extracted ?? exception.message);
      } else {
        message = exception.message;
      }
    }

    response.status(status).json({
      success: false,
      message,
      data: null,
      listData: null,
      token: null,
    });
  }
}
