import { body } from 'express-validator';

import { validate } from './validate.middleware';

export const createVirtualAccountValidator = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  validate,
];

export const createDirectDebitMandateValidator = [
  body('planId')
    .trim()
    .notEmpty()
    .withMessage('Plan ID is required')
    .isUUID()
    .withMessage('Plan ID must be a valid UUID'),
  body('customerAccountNumber')
    .trim()
    .notEmpty()
    .withMessage('Customer account number is required')
    .isLength({ min: 10, max: 10 })
    .withMessage('Customer account number must be exactly 10 digits'),
  body('bankCode').trim().notEmpty().withMessage('Bank code is required'),
  body('customerAddress').trim().notEmpty().withMessage('Customer address is required'),
  body('customerAccountName').trim().notEmpty().withMessage('Customer account name is required'),
  validate,
];
