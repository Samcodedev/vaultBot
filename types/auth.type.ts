export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface UserPayload {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  accountNumber?: string;
  accountId?: string;
  bankAccountName?: string;
  bankName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  statusCode: number;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  statusCode: number;
  errors?: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
