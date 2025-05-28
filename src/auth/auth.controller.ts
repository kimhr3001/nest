import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, RefreshTokenDto } from './dto';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60 } }) // 1분당 5회로 제한
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description: '사용자 로그인을 수행합니다.',
  })
  @SwaggerApiResponse({
    status: 200,
    description: '로그인이 성공적으로 완료되었습니다.',
    type: LoginResponseDto,
  })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    return await this.authService.login(loginDto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '리프레시 토큰 갱신',
    description: '리프레시 토큰을 갱신합니다.',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<any> {
    const refreshToken = refreshTokenDto.refreshToken;
    const userId = refreshTokenDto.userId;
    return await this.authService.refreshToken(userId, refreshToken);
  }
}
