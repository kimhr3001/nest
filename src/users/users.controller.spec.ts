import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService = {
    create: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async function (this: void) {
      const createUserDto = {
        email: 'test@example.com',
        password: 'password123',
        name: '테스트',
      };

      const mockUser: User = {
        id: 1,
        email: createUserDto.email,
        password: 'hashed_password',
        name: createUserDto.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        data: mockUser,
      };

      jest.spyOn(mockUsersService, 'create').mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(result).toEqual(mockResponse);
      expect(mockUsersService.create).toHaveBeenCalledWith(
        createUserDto.email,
        createUserDto.password,
        createUserDto.name,
      );
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async function (this: void) {
      const userId = '1';
      const mockUser: Omit<User, 'password'> = {
        id: 1,
        email: 'test@example.com',
        name: '테스트',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        data: mockUser,
      };

      jest.spyOn(mockUsersService, 'findById').mockResolvedValue(mockUser);

      const result = await controller.findOne(userId);

      expect(result).toEqual(mockResponse);
      expect(mockUsersService.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when user is not found', async function (this: void) {
      const userId = '999';
      const mockResponse = {
        data: null,
      };

      jest.spyOn(mockUsersService, 'findById').mockResolvedValue(null);

      const result = await controller.findOne(userId);

      expect(result).toEqual(mockResponse);
      expect(mockUsersService.findById).toHaveBeenCalledWith(999);
    });
  });
});
