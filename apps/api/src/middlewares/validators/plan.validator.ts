import { body } from 'express-validator';

import { validate } from './validate.middleware.js';
import { SAVING_TYPE, SAVING_PLAN } from '../../utils/index.js';

export const createPlanValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Plan name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Plan name must be between 2 and 80 characters'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description must be at most 255 characters'),

  body('savingType')
    .notEmpty()
    .withMessage('Saving type is required')
    .isIn([...SAVING_TYPE])
    .withMessage(`Saving type must be one of: ${SAVING_TYPE.join(', ')}`),

  body('savingPlan')
    .notEmpty()
    .withMessage('Saving plan type is required')
    .isIn([...SAVING_PLAN])
    .withMessage(`Saving plan must be one of: ${SAVING_PLAN.join(', ')}`),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),

  body('targetAmount')
    .notEmpty()
    .withMessage('Target amount is required')
    .isFloat({ min: 1 })
    .withMessage('Target amount must be a positive number'),

  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),

  body('debitSchedule').notEmpty().withMessage('Debit schedule time is required (e.g. "08:00 AM")'),

  // Fantasy-savings specific
  body('teamName')
    .if(body('savingPlan').equals('fantasy-savings'))
    .notEmpty()
    .withMessage('Team name is required for fantasy-savings plans')
    .trim(),

  validate,
];
