import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisService } from './service';
import { createKeyv } from '@keyv/redis';

const { REDIS_HOST = '127.0.0.1', REDIS_PORT = 6379 } = process.env;

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => {
        return {
          stores: [createKeyv(`redis://${REDIS_HOST}:${REDIS_PORT}`)],
        };
      },
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
