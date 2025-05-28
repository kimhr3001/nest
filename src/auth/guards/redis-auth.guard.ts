import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { RedisService } from '../../libs/redis';
import { ConfigService } from '@nestjs/config';
import { TokenPolicy } from '../../common/policy';

@Injectable()
export class RedisAuthGuard implements CanActivate {
  constructor(
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new HttpException(
        '인증 토큰이 필요합니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const isValid = await this.validateToken(token);
    if (!isValid) {
      throw new HttpException(
        '유효하지 않은 토큰입니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (!token) {
      throw new HttpException(
        '인증 토큰이 필요합니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return type.toLowerCase() === 'bearer' ? token : undefined;
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const redisPrefix = this.configService.get<string>(
        'REDIS_PREFIX',
        'local',
      );
      const tokenKey = `${redisPrefix}:${TokenPolicy.ACCESS_TOKEN.REDIS_PREFIX}:${token}`;

      const storedTokenData = await this.redisService.get(tokenKey);
      if (!storedTokenData) {
        return false;
      }

      const parsedData = JSON.parse(storedTokenData) as {
        accessToken: string;
      };
      return parsedData.accessToken === token;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
}
