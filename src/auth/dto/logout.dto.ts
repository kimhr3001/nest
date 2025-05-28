import { ApiProperty } from '@nestjs/swagger';

export class LogoutDto {
  @ApiProperty({
    description: '사용자 ID',
    example: 1,
  })
  userId: number;
}
