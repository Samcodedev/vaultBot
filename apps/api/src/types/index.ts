import type { Request } from 'express';
import type { UserPayload } from '../../../../types/auth.type';

export interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  phoneNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
  password?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

export {
  type ApiErrorResponse,
  type ApiResponse,
  type ApiSuccessResponse,
  type LoginUserInput,
  type RegisterUserInput,
  type UserResponse,
} from '../../../../types/auth.type';
