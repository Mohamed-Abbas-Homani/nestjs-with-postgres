import { User } from './user.entity';

export type SignUpResponse = {
  message: string;
  user: User;
};

export type LoginResponse = {
  message: string;
  user: User;
  token: string;
};
