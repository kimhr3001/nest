import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { RedisService } from '../libs/redis';
import { ConfigService } from '@nestjs/config';
import { TokenPolicy, TokenData } from '../policy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ email: string; id: number } | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return { email: user.email, id: user.id };
    }
    return null;
  }

  async login(
    loginDto: LoginDto,
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException({
        message: '이메일 또는 비밀번호가 일치하지 않습니다.',
        error: 'Authentication Failed',
        details: '존재하지 않는 이메일입니다.',
      });
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        message: '이메일 또는 비밀번호가 일치하지 않습니다.',
        error: 'Authentication Failed',
        details: '비밀번호가 일치하지 않습니다.',
      });
    }
    const { accessToken, refreshToken } = await this.setToken(user);
    return {
      data: { accessToken, refreshToken },
    };
  }
  private async setToken(user: { id: number; email: string }) {
    const { ACCESS_TOKEN, REFRESH_TOKEN } = TokenPolicy;

    const payload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: ACCESS_TOKEN.EXPIRES_IN,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: REFRESH_TOKEN.EXPIRES_IN,
      }),
    ]);

    // Redis에 토큰 저장
    const redisPrefix = this.configService.get<string>('REDIS_PREFIX', 'local');

    const accessTokenKey = `${redisPrefix}:${ACCESS_TOKEN.REDIS_PREFIX}:${user.id}`;
    const refreshTokenKey = `${redisPrefix}:${REFRESH_TOKEN.REDIS_PREFIX}:${user.id}`;

    const value = {
      userId: user.id,
      email: user.email,
    };

    await Promise.all([
      this.redisService.set(
        accessTokenKey,
        JSON.stringify({ ...value, accessToken }),
        ACCESS_TOKEN.EXPIRES_IN,
      ),
      this.redisService.set(
        refreshTokenKey,
        JSON.stringify({ ...value, refreshToken }),
        REFRESH_TOKEN.EXPIRES_IN,
      ),
    ]);

    const at = await this.redisService.get(accessTokenKey);
    const rt = await this.redisService.get(refreshTokenKey);

    console.log('tokens::', { at, rt });

    return { accessToken, refreshToken };
  }

  async validateToken(userId: number, token: string): Promise<boolean> {
    try {
      const redisPrefix = this.configService.get<string>(
        'REDIS_PREFIX',
        'local',
      );
      const tokenKey = `${redisPrefix}:${TokenPolicy.ACCESS_TOKEN.REDIS_PREFIX}:${userId}`;
      const storedTokenData = await this.redisService.get(tokenKey);

      if (!storedTokenData) {
        return false;
      }

      const { access_token } = JSON.parse(storedTokenData) as TokenData;
      return access_token === token;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
}
