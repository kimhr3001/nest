import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { RedisService } from '../libs/redis';
import { ConfigService } from '@nestjs/config';
import { TokenPolicy } from '../common/policy';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  private async setToken(user: { id: number; email: string }) {
    const { ACCESS_TOKEN, REFRESH_TOKEN } = TokenPolicy;
    const redisPrefix = this.configService.get<string>('REDIS_PREFIX', 'local');

    const accessToken = this.generateSecureToken();
    const refreshToken = this.generateSecureToken();

    const value = {
      userId: user.id,
      email: user.email,
    };

    const accessTokenKey = `${redisPrefix}:${ACCESS_TOKEN.REDIS_PREFIX}:${accessToken}`;
    const refreshTokenKey = `${redisPrefix}:${REFRESH_TOKEN.REDIS_PREFIX}:${refreshToken}`;

    await Promise.all([
      this.redisService.set(
        accessTokenKey,
        JSON.stringify({ ...value, accessToken, refreshToken }),
        ACCESS_TOKEN.EXPIRES_IN,
      ),
      this.redisService.set(
        refreshTokenKey,
        JSON.stringify({ ...value, refreshToken, accessToken }),
        REFRESH_TOKEN.EXPIRES_IN,
      ),
    ]);

    return { accessToken, refreshToken };
  }
  private async checkToken(
    accessToken: string,
    userId: number,
  ): Promise<{ userId: number; refreshToken: string; accessToken: string }> {
    const redisPrefix = this.configService.get<string>('REDIS_PREFIX', 'local');
    const accessTokenKey = `${redisPrefix}:${TokenPolicy.ACCESS_TOKEN.REDIS_PREFIX}:${accessToken}`;

    const accessTokenData = await this.redisService.get(accessTokenKey);

    if (!accessTokenData) {
      throw new HttpException(
        '유효하지 않은 토큰입니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const parsedAccessTokenData = JSON.parse(accessTokenData) as {
      userId: number;
      refreshToken: string;
      accessToken: string;
    };

    if (parsedAccessTokenData.userId !== userId) {
      throw new HttpException(
        '유효하지 않은 토큰입니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return parsedAccessTokenData;
  }
  private async validateUser(
    email: string,
    password: string,
  ): Promise<{ email: string; id: number }> {
    const user = await this.usersService.getByEmail(email);
    if (!user) {
      throw new HttpException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new HttpException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    return { email: user.email, id: user.id };
  }

  async refreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const redisPrefix = this.configService.get<string>('REDIS_PREFIX', 'local');
    const refreshTokenKey = `${redisPrefix}:${TokenPolicy.REFRESH_TOKEN.REDIS_PREFIX}:${refreshToken}`;

    const storedTokenData = await this.redisService.get(refreshTokenKey);
    if (!storedTokenData) {
      throw new HttpException(
        '유효하지 않은 리프레시 토큰입니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const parsedData = JSON.parse(storedTokenData) as {
      refreshToken: string;
      userId: number;
    };
    if (
      parsedData.refreshToken !== refreshToken ||
      parsedData.userId !== userId
    ) {
      throw new HttpException(
        '유효하지 않은 리프레시 토큰입니다.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const user = await this.usersService.getById(parsedData.userId);
    if (!user) {
      throw new HttpException(
        '사용자를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }
    return await this.setToken(user);
  }

  async login(
    loginDto: LoginDto,
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const { accessToken, refreshToken } = await this.setToken(user);
    return {
      data: { accessToken, refreshToken },
    };
  }

  async logout(
    userId: number,
    accessToken: string,
  ): Promise<ApiResponse<{ message: string; success: boolean }>> {
    const redisPrefix = this.configService.get<string>('REDIS_PREFIX', 'local');
    const {
      refreshToken: checkedRefreshToken,
      accessToken: checkedAccessToken,
    } = await this.checkToken(accessToken, userId);

    const accessTokenKey = `${redisPrefix}:${TokenPolicy.ACCESS_TOKEN.REDIS_PREFIX}:${checkedAccessToken}`;
    const refreshTokenKey = `${redisPrefix}:${TokenPolicy.REFRESH_TOKEN.REDIS_PREFIX}:${checkedRefreshToken}`;

    await Promise.all([
      this.redisService.del(accessTokenKey),
      this.redisService.del(refreshTokenKey),
    ]);

    return {
      data: {
        success: true,
        message: '로그아웃 성공',
      },
    };
  }

  async withDraw(
    userId: number,
    accessToken: string,
  ): Promise<ApiResponse<{ message: string; success: boolean }>> {
    await this.logout(userId, accessToken);
    await this.usersService.updateById(userId, {
      state: 'WITHDRAWN',
    });
    return {
      data: { message: '탈퇴 처리 완료', success: true },
    };
  }
}
