import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User();
    user.email = email;
    user.password = hashedPassword;
    return await this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  //Compare Password
  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  //Generate Token
  createToken(id: string): string {
    return jwt.sign({ id }, process.env.JWT_SECRET);
  }

  //Request Validation
  isRequestBodyValid(email: string, password: string) : boolean {
    return this.isEmailValid(email) && this.isPasswordValid(password)
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
