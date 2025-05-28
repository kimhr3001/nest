import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RedisModule } from '../libs/redis';
import { UsersModule } from '../users/users.module';
import { ConfigModule } from '@nestjs/config';
import { RedisAuthGuard } from './guards/redis-auth.guard';

@Module({
  imports: [PassportModule, UsersModule, ConfigModule, RedisModule],
  providers: [AuthService, RedisAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, RedisAuthGuard],
})
export class AuthModule {}
