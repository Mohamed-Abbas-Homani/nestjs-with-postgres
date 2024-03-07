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
import { LoginResponse, SignUpResponse } from './user.model';
import { User } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //Signup
  @Post('signup')
  async signUp(
    @Body('email') email: string,
    @Body('password') password: string,
  ) : Promise<SignUpResponse> {
    //Request Validation
    this.validateRequestBody(email, password);

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
  ) : Promise<LoginResponse> {
    //Request Validation
    this.validateRequestBody(email, password);

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
  async getUsers() : Promise<User[]>{
    const users = await this.usersService.getAllUsers();
    if (users.length == 0) {
      throw new NotFoundException('No users found');
    }

    return users;
  }

  //Request Validation
  private validateRequestBody(email: string, password: string) {
    if (!this.isEmailValid(email)) {
      throw new BadRequestException('Email is not valid');
    }

    if (!this.isPasswordValid(password)) {
      throw new BadRequestException('Password is not valid');
    }
  }

  //Email Validation
  private isEmailValid(email: string): boolean {
    // Regular expression for validating email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  //Password Validation
  isPasswordValid(password: string): boolean {
    // Password must be at least 8 characters long and contain at least one letter, one number, and one special character.
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
  }
}
