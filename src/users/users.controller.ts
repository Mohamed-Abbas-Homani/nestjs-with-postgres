import {
  Controller,
  Post,
  Body,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  HttpStatus,
  HttpCode,
  Get,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { LoginResponse, SignUpResponse } from './user.interfaces';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //Signup
  @Post('signup')
  async signUp(
    @Body('email') email: string,
    @Body('password') password: string,
  ): Promise<SignUpResponse> {
    //Request Validation
    if (!this.usersService.isRequestBodyValid(email, password)) {
      throw new BadRequestException('Invalid email or password');
    }

    //Check if user already exist
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    //Create User
    const user = await this.usersService.createUser(email, password);
    delete user.password;
    return { message: 'User created successfully', user };
  }

  //Login
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ): Promise<LoginResponse> {
    //Request Validation
    if (!this.usersService.isRequestBodyValid(email, password)) {
      throw new BadRequestException('Invalid email or password');
    }

    //Check if user does not exist
    const existingUser = await this.usersService.findByEmail(email);
    if (!existingUser) {
      throw new NotFoundException('User does not exist');
    }

    //Compare Passwords
    const isPasswordMatch = await this.usersService.comparePassword(
      password,
      existingUser.password,
    );

    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    //Generate Token
    const token = this.usersService.createToken(existingUser.id.toString());

    //Response
    delete existingUser.password;
    return {
      message: 'User logged in successfully',
      user: existingUser,
      token,
    };
  }

  //Get all users
  @Get()
  async getUsers(): Promise<User[]> {
    const users = await this.usersService.getAllUsers();
    if (users.length == 0) {
      throw new NotFoundException('No users found');
    }

    return users;
  }
}
