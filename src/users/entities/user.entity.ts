import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
export class User {
  @ApiProperty({
    description: '사용자 ID',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com',
  })
  @Column({ unique: true })
  email: string;

  @ApiProperty({
    description: '사용자 비밀번호',
    example: 'hashed_password',
  })
  @Column()
  password: string;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: '생성일',
    example: '2024-03-20T00:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
    example: '2024-03-20T00:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}
