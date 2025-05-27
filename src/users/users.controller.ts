import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { ApiResponse } from '../common/interfaces/api-response.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
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
    const user = await this.usersService.create(
      createUserDto.email,
      createUserDto.password,
      createUserDto.name,
    );
    return { data: user };
  }

  @UseGuards(JwtAuthGuard)
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
    console.log('findOne', id);
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new Error('유효하지 않은 사용자 ID입니다.');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
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
    const testUser = await this.usersService.create(
      'test@example.com',
      'test1234',
      '테스트 사용자',
    );
    return { data: testUser };
  }
}
