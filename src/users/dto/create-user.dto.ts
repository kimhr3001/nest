import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자 타입',
    example: 'USER',
  })
  type: string;

  @ApiProperty({
    description: '사용자 상태',
    example: 'NORMAL',
  })
  state: string;

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

  @ApiProperty({
    description: '사용자 추가 정보',
    example: {
      phone: '01012345678',
      address: [
        {
          type: 'DEFAULT',
          address: '서울시 강남구 역삼동',
          detail: '101동 101호',
        },
      ],
    },
  })
  extras: JSON;
}
