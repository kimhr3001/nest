import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register({
          store: redisStore,
          host: 'localhost',
          port: 6379,
          db: 0,
        }),
      ],
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    // 테스트 후 캐시 정리
    await service.del('test-key');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should set and get value', async () => {
    const testKey = 'test-key';
    const testValue = 'test-value';

    await service.set(testKey, testValue);
    const result = await service.get(testKey);

    expect(result).toBe(testValue);
  });

  // it('should delete value', async () => {
  //   const testKey = 'test-key';
  //   const testValue = 'test-value';

  //   await service.set(testKey, testValue);
  //   await service.del(testKey);
  //   const result = await service.get(testKey);

  //   expect(result).toBeNull();
  // });

  // it('should handle TTL correctly', async () => {
  //   const testKey = 'test-key';
  //   const testValue = 'test-value';
  //   const ttl = 1; // 1초

  //   await service.set(testKey, testValue, ttl);

  //   // TTL이 만료되기 전에 값을 확인
  //   const resultBefore = await service.get(testKey);
  //   expect(resultBefore).toBe(testValue);

  //   // TTL이 만료될 때까지 대기
  //   await new Promise((resolve) => setTimeout(resolve, 1100));

  //   // TTL이 만료된 후 값을 확인
  //   const resultAfter = await service.get(testKey);
  //   expect(resultAfter).toBeNull();
  // });
});
