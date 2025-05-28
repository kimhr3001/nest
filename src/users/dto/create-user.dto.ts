import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'test@example.com',
  })
  email: string;

  @ApiProperty({
    description: '사용자 비밀번호',
    example: 'test1234',
  })
  password: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
  })
  name: string;
}
