import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(email: string, password: string, name: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      name,
    });
    return await this.usersRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { id } });
  }
  // 이메일 중복 체크
  async checkEmailDuplication(email: string): Promise<void> {
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    // 이메일 중복 체크
    if (existingUser) {
      throw new HttpException(
        '이미 존재하는 이메일입니다.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
