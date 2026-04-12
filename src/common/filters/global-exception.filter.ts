import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObject = exceptionResponse as Record<string, unknown>;

        message =
          typeof responseObject.message === 'string'
            ? responseObject.message
            : Array.isArray(responseObject.message)
              ? 'Validation failed'
              : (responseObject.error as string) || message;

        details = Array.isArray(responseObject.message)
          ? responseObject.message
          : responseObject;

        errorCode = this.mapStatusToErrorCode(status, responseObject);
      }
    }

    response.status(status).json({
      success: false,
      message,
      error: {
        code: errorCode,
        details,
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapStatusToErrorCode(
    status: number,
    responseObject: Record<string, unknown>,
  ): string {
    if (typeof responseObject.code === 'string') {
      return responseObject.code;
    }

    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}