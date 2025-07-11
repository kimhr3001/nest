import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { HttpException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserDto } from './dto/user.dto';

describe('UsersService', () => {
  let service: UsersService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let repository: Repository<User>;

  const mockUser = {
    id: 1,
    type: 'USER',
    state: 'NORMAL',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    extras: JSON.parse(
      '{"phone": "01012345678", "address": [{"type": "DEFAULT", "address": "서울시 강남구 역삼동", "detail": "101동 101호"}]}',
    ) as JSON,
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword' as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const plainPassword = 'password123';
      const UserDto: UserDto = {
        type: 'USER',
        state: 'NORMAL',
        email: 'test@example.com',
        password: plainPassword,
        name: 'Test User',
        extras: JSON.parse(
          '{"phone": "01012345678", "address": [{"type": "DEFAULT", "address": "서울시 강남구 역삼동", "detail": "101동 101호"}]}',
        ) as JSON,
      };

      mockRepository.create.mockReturnValue({
        ...UserDto,
        password: 'hashedPassword',
      });
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(UserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...UserDto,
        password: 'hashedPassword',
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('getByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'test@example.com';
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getByEmail(email);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      const email = 'nonexistent@example.com';
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('getById', () => {
    it('should find a user by id', async () => {
      const id = 1;
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getById(id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      const id = 999;
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getById(id);

      expect(result).toBeNull();
    });
  });

  describe('checkEmailDuplication', () => {
    it('should throw HttpException when email is duplicated', async () => {
      const email = 'existing@example.com';
      mockRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.checkEmailDuplication(email)).rejects.toThrow(
        HttpException,
      );
      await expect(service.checkEmailDuplication(email)).rejects.toThrow(
        '이미 존재하는 이메일입니다.',
      );
    });

    it('should not throw exception when email is not duplicated', async () => {
      const email = 'new@example.com';
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.checkEmailDuplication(email)).resolves.not.toThrow();
    });
  });
});
