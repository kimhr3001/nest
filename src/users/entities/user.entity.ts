import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @ApiProperty({
    description: '사용자 ID',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: '사용자 타입',
    example: 'USER',
  })
  @Column()
  type: string;

  @ApiProperty({
    description: '사용자 상태',
    example: 'NORMAL',
  })
  @Column()
  state: string;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'test@example.com',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    description: '사용자 비밀번호',
    example: 'hashed_password',
    writeOnly: true,
  })
  @Exclude()
  @Column()
  password: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
  })
  @Column()
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
  @Column({ type: 'json' })
  extras: JSON;

  @ApiProperty({
    description: '생성일',
    example: '2024-03-20T00:00:00.000Z',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
    example: '2024-03-20T00:00:00.000Z',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
