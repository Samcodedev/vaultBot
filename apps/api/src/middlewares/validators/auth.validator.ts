import { body, param } from 'express-validator';

export const registerUserValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 5, max: 50 })
    .withMessage('Name must be between 5 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .isStrongPassword({
      minLength: 6,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage('Password must be at least 6 characters long and include uppercase, lowercase, number, and symbol'),
  body('phoneNumber')
    .optional({ values: 'falsy' })
    .isMobilePhone('en-NG')
    .withMessage('Please provide a valid phone number'),
];

export const loginUserValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const getUserValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
];