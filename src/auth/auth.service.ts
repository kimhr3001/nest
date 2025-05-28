import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { RedisService } from '../libs/redis/service';
import { ConfigService } from '@nestjs/config';

interface TokenData {
  access_token: string;
  user_id: number;
  email: string;
}

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
  ): Promise<ApiResponse<{ access_token: string }>> {
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

    const payload = { sub: user.id, email: user.email };
    const access_token = await this.jwtService.signAsync(payload);

    // Redis에 토큰 저장
    const redisPrefix = this.configService.get<string>('REDIS_PREFIX', 'local');
    const tokenKey = `${redisPrefix}:${user.id}`;
    const value = JSON.stringify({
      access_token,
      user_id: user.id,
      email: user.email,
    });
    await this.redisService.set(tokenKey, value, 60 * 60); // 1시간
    return {
      data: { access_token },
    };
  }

  async validateToken(userId: number, token: string): Promise<boolean> {
    try {
      const redisPrefix = this.configService.get<string>(
        'REDIS_PREFIX',
        'local',
      );
      const tokenKey = `${redisPrefix}:${userId}`;
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
