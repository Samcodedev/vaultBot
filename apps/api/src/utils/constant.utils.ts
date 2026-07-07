export const INTERNAL_SERVER_ERROR = {
  ERROR: 'Internal server error',
  STATUS_CODE: 500,
};
export const NOT_FOUND = {
  ERROR: 'Not found',
  STATUS_CODE: 404,
  USER_NOT_FOUND: 'User not found',
  EMAIL_NOT_FOUND: 'Email not found',
};
export const BAD_REQUEST = {
  ERROR: 'Bad request',
  STATUS_CODE: 400,
  INVALID_EMAIL: 'Invalid email',
};
export const UNAUTHORIZED = {
  ERROR: 'Unauthorized',
  STATUS_CODE: 401,
};
export const UNAUTHORIZED_ACCESS = 'Unauthorized access';
export const FORBIDDEN = {
  ERROR: 'Forbidden',
  STATUS_CODE: 403,
};
export const CONFLICT = {
  ERROR: 'Conflict',
  STATUS_CODE: 409,
};

export const SAVING_TYPE = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export const SAVING_PLAN = ['fantasy-savings', 'vault'] as const;
