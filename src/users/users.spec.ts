import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginResponse, SignUpResponse } from './user.model';
import { User } from './user.entity';
import { Repository } from 'typeorm';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;
  let userRepository: Repository<User>
  beforeEach(async () => {
    userRepository = new Repository(User, null)
    usersService = new UsersService(userRepository)
    usersController = new UsersController(usersService)
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should create a new user', async () => {
      const mockUser = { id: 1, email: 'test@example.com', password: 'Password#1' };
      const mockSignUpResponse: SignUpResponse = { message: 'User created successfully', user: mockUser };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(usersService, 'createUser').mockResolvedValue(mockUser);

      const result = await usersController.signUp('test@example.com', 'Password#1');

      expect(result).toEqual(mockSignUpResponse);
    });

    it('should throw BadRequestException if email or password are invalid', async () => {
      await expect(usersController.signUp('bademail', 'badpassword')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email already exists', async () => {
      const mockUser = { id: 1, email: 'existing@example.com', password: 'Password#1' };
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);

      await expect(usersController.signUp('existing@example.com', 'Password#1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should log in an existing user with correct credentials', async () => {
      const mockUser = { id: 1, email: 'test@example.com', password: 'Password#1' };
      const mockLoginResponse: LoginResponse = { message: 'User logged in successfully', user: mockUser, token: 'token' };

      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'comparePassword').mockResolvedValue(true);
      jest.spyOn(usersService, 'createToken').mockReturnValue('token');

      const result = await usersController.login('test@example.com', 'Password#1');

      expect(result).toEqual(mockLoginResponse);
    });

    it('should throw BadRequestException if email or password are invalid', async () => {
      await expect(usersController.login('bademail', 'badpassword')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(usersController.login('nonexistent@example.com', 'Password#1')).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const mockUser = { id: 1, email: 'test@example.com', password: 'Password#1' };
      
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(usersService, 'comparePassword').mockResolvedValue(false);

      await expect(usersController.login('test@example.com', 'Password#1')).rejects.toThrow(UnauthorizedException);
    });
  });
});
