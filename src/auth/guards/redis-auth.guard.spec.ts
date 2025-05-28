import { Test, TestingModule } from '@nestjs/testing';
import { RedisAuthGuard } from './redis-auth.guard';
import { RedisService } from '../../libs/redis';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';

describe('RedisAuthGuard', () => {
  let guard: RedisAuthGuard;

  const mockRedisService = {
    get: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisAuthGuard,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<RedisAuthGuard>(RedisAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should throw UNAUTHORIZED when no token is provided', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new HttpException('인증 토큰이 필요합니다.', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should throw UNAUTHORIZED when token is invalid', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'Bearer invalid-token',
            },
          }),
        }),
      } as ExecutionContext;

      mockConfigService.get.mockReturnValue('test');
      mockRedisService.get.mockResolvedValue(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(
        new HttpException('유효하지 않은 토큰입니다.', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should return true when token is valid', async () => {
      const validToken = 'valid-token';
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: `Bearer ${validToken}`,
            },
          }),
        }),
      } as ExecutionContext;

      mockConfigService.get.mockReturnValue('test');
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ accessToken: validToken }),
      );

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should throw UNAUTHORIZED when authorization header is missing', () => {
      const mockRequest = {
        headers: {},
      } as Request;

      expect(() => guard['extractTokenFromHeader'](mockRequest)).toThrow(
        new HttpException('인증 토큰이 필요합니다.', HttpStatus.UNAUTHORIZED),
      );
    });

    it('should return token when valid bearer token is provided', () => {
      const token = 'test-token';
      const mockRequest = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      } as Request;

      const result = guard['extractTokenFromHeader'](mockRequest);
      expect(result).toBe(token);
    });

    it('should return undefined when non-bearer token is provided', () => {
      const mockRequest = {
        headers: {
          authorization: 'Basic test-token',
        },
      } as Request;

      const result = guard['extractTokenFromHeader'](mockRequest);
      expect(result).toBeUndefined();
    });
  });

  describe('validateToken', () => {
    it('should return false when token is not found in Redis', async () => {
      mockConfigService.get.mockReturnValue('test');
      mockRedisService.get.mockResolvedValue(null);

      const result = await guard['validateToken']('test-token');
      expect(result).toBe(false);
    });

    it('should return false when token does not match stored token', async () => {
      mockConfigService.get.mockReturnValue('test');
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ accessToken: 'different-token' }),
      );

      const result = await guard['validateToken']('test-token');
      expect(result).toBe(false);
    });

    it('should return true when token matches stored token', async () => {
      const token = 'test-token';
      mockConfigService.get.mockReturnValue('test');
      mockRedisService.get.mockResolvedValue(
        JSON.stringify({ accessToken: token }),
      );

      const result = await guard['validateToken'](token);
      expect(result).toBe(true);
    });

    it('should return false when Redis throws an error', async () => {
      mockConfigService.get.mockReturnValue('test');
      mockRedisService.get.mockRejectedValue(new Error('Redis error'));

      const result = await guard['validateToken']('test-token');
      expect(result).toBe(false);
    });
  });
});
