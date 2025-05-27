import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
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
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            access_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
      },
    },
  })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<ApiResponse<{ access_token: string }>> {
    console.log('Login DTO:', {
      email: loginDto.email,
      password: '[REDACTED]', // 보안을 위해 비밀번호는 마스킹
    });
    return await this.authService.login(loginDto);
  }
}
