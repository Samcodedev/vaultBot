import type { UserResponse, LoginUserInput, RegisterUserInput } from '../../../../types';

export type { LoginUserInput, RegisterUserInput };

export interface User extends Omit<UserResponse, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}
