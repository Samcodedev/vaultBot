export const VALID_USER_DETAILS = {
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  password: 'Password1!',
  bcryptPassword: '$2b$10$hashedPasswordPlaceholder',
  phoneNumber: '08064434940',
};

export const INVALID_USER_DETAILS = {
  email: 'not-an-email',
  password: 'Password',
  phoneNumber: '1234567890',
};

export const API = '/api/auth';
