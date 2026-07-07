import { body } from 'express-validator';

import { validate } from './validate.middleware';

export const createTransactionValidator = [
  body('planId')
    .trim()
    .notEmpty()
    .withMessage('Plan ID is required')
    .isUUID()
    .withMessage('Plan ID must be a valid UUID'),
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),
  body('type')
    .notEmpty()
    .withMessage('Transaction type is required')
    .isIn(['deposit', 'auto-save'])
    .withMessage('Transaction type must be either deposit or auto-save'),
  validate,
];
