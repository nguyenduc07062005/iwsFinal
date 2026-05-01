import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type NormalizedErrorBody = {
  statusCode: number;
  error: string;
  message: string;
  errors?: string[];
  method: string;
  path: string;
  timestamp: string;
};

type HttpExceptionResponse = {
  statusCode?: number;
  error?: string;
  message?: string | string[];
  errors?: string[];
};

const DEFAULT_HTTP_ERRORS: Readonly<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]: 'Bad Request',
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
  [HttpStatus.NOT_FOUND]: 'Not Found',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Too Many Requests',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const body = this.normalizeException(exception, request);

    if (body.statusCode >= 500) {
      this.logger.error(
        `Unhandled request error: ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(body.statusCode).json(body);
  }

  private normalizeException(
    exception: unknown,
    request: Request,
  ): NormalizedErrorBody {
    if (exception instanceof HttpException) {
      return this.normalizeHttpException(exception, request);
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Internal server error',
      method: request.method,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
  }

  private normalizeHttpException(
    exception: HttpException,
    request: Request,
  ): NormalizedErrorBody {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();
    const responseBody =
      typeof response === 'object' && response !== null
        ? (response as HttpExceptionResponse)
        : undefined;
    const errors =
      responseBody?.errors ??
      (Array.isArray(responseBody?.message) ? responseBody.message : undefined);
    const message = this.normalizeMessage(responseBody?.message, response);

    return {
      statusCode: responseBody?.statusCode ?? statusCode,
      error: responseBody?.error ?? this.getDefaultError(statusCode),
      message,
      ...(errors ? { errors } : {}),
      method: request.method,
      path: request.url,
      timestamp: new Date().toISOString(),
    };
  }

  private normalizeMessage(
    message: HttpExceptionResponse['message'],
    rawResponse: string | object,
  ): string {
    if (Array.isArray(message)) {
      return message[0] ?? 'Request failed';
    }

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (typeof rawResponse === 'string' && rawResponse.trim()) {
      return rawResponse;
    }

    return 'Request failed';
  }

  private getDefaultError(statusCode: number): string {
    return (
      DEFAULT_HTTP_ERRORS[statusCode] ??
      (statusCode >= 500 ? 'Internal Server Error' : 'Request Error')
    );
  }
}
