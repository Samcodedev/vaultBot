import type { Request } from 'express';

import type { UserPayload } from '../../../../types/auth.type';

export interface UserRecord {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  accountNumber?: string | null;
  accountId?: string | null;
  bankAccountName?: string | null;
  bankName?: string | null;
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
