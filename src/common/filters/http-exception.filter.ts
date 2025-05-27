import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorResponse } from '../interfaces/error-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage = '서버 오류가 발생했습니다.';
    let errorType = 'Internal Server Error';
    let errorDetails: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      // 에러 응답이 객체인 경우 (상세 정보가 포함된 경우)
      if (typeof errorResponse === 'object' && errorResponse !== null) {
        const error = errorResponse as {
          message?: string;
          error?: string;
          details?: string;
        };
        errorMessage = error.message || errorMessage;
        errorType = error.error || errorType;
        errorDetails = error.details;
      } else {
        // 에러 응답이 문자열인 경우
        errorMessage = errorResponse as unknown as string;
      }

      // 인증/인가 관련 에러 처리
      if (status === HttpStatus.UNAUTHORIZED) {
        errorType = 'Unauthorized';
      } else if (status === HttpStatus.FORBIDDEN) {
        errorType = 'Forbidden';
      } else if (status === HttpStatus.BAD_REQUEST) {
        errorType = 'Bad Request';
      } else if (status === HttpStatus.NOT_FOUND) {
        errorType = 'Not Found';
      }
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: errorMessage,
      error: errorType,
      ...(errorDetails && { details: errorDetails }),
    };

    response.status(status).json(errorResponse);
  }
}
