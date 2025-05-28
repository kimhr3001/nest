import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { RedisAuthGuard } from '../auth/guards/redis-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(RedisAuthGuard)
  @ApiBearerAuth('access-token')
  @Post()
  @ApiOperation({
    summary: '사용자 생성',
    description: '새로운 사용자를 생성합니다.',
  })
  @SwaggerApiResponse({
    status: 201,
    description: '사용자가 성공적으로 생성되었습니다.',
    type: User,
  })
  async create(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ApiResponse<User>> {
    await this.usersService.checkEmailDuplication(createUserDto.email);

    const user = await this.usersService.create(createUserDto);
    return { data: user };
  }

  @UseGuards(RedisAuthGuard)
  @ApiBearerAuth('access-token')
  @Get(':id')
  @ApiOperation({
    summary: '사용자 조회',
    description: 'ID로 사용자를 조회합니다.',
  })
  @SwaggerApiResponse({
    status: 200,
    description: '사용자 정보를 성공적으로 조회했습니다.',
    type: User,
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<Omit<User, 'password'>>> {
    const userId = parseInt(id, 10);

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new HttpException(
        '사용자를 찾을 수 없습니다.',
        HttpStatus.NOT_FOUND,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...excludePasswordUser } = user;
    return { data: excludePasswordUser };
  }

  @Post('test')
  @ApiOperation({
    summary: '테스트용 사용자 생성',
    description:
      '테스트를 위한 사용자를 생성합니다. 이 API는 인증이 필요하지 않습니다.',
  })
  @SwaggerApiResponse({
    status: 201,
    description: '테스트용 사용자가 성공적으로 생성되었습니다.',
    type: User,
  })
  async createTestUser(): Promise<ApiResponse<User>> {
    await this.usersService.checkEmailDuplication('test@example.com');
    const testUserData = {
      type: 'USER',
      state: 'NORMAL',
      email: 'test@example.com',
      password: 'test1234',
      name: '테스트 사용자',
      extras: {
        phone: '01012345678',
        address: [
          {
            type: 'DEFAULT',
            address: '서울시 강남구 역삼동',
            detail: '101동 101호',
          },
        ],
      },
    } as unknown as CreateUserDto;
    const testUser = await this.usersService.create(testUserData);
    return { data: testUser };
  }
}
