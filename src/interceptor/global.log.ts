import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { Logger } from '@nestjs/common';

const logger = new Logger('GlobalLog');

@Injectable()
export class GlobalLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context
      .switchToHttp()
      .getRequest<Request<object, object, unknown>>();

    const { method, url, path } = request;
    const requestData = {
      body: request.body,
      params:
        Object.keys(request.params).length > 0 ? request.params : undefined,
      query: Object.keys(request.query).length > 0 ? request.query : undefined,
    };
    const now = Date.now();

    const log: {
      method: string;
      url: string;
      path: string;
      request: Record<string, any>;
      response?: Record<string, any>;
      responseTime?: number;
    } = {
      method,
      url,
      path,
      request: requestData,
    };

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - now;
        log.response = data as Record<string, any>;
        log.responseTime = responseTime;
        logger.log(JSON.stringify(log));
      }),
    );
  }
}
