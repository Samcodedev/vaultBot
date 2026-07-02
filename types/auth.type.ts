export interface RegisterUserInput {
  name: string;
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
  name: string;
  email: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
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
