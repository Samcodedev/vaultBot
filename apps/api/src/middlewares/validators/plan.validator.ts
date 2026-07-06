import { body } from 'express-validator';

import { validate } from './validate.middleware.js';
import { SAVING_TYPE, SAVING_PLAN } from '../../utils/index.js';

export const createPlanValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Plan title is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Plan title must be between 2 and 80 characters'),

  body('description')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description must be at most 255 characters'),

  body('savingPlan')
    .notEmpty()
    .withMessage('Saving plan type is required')
    .isIn([...SAVING_PLAN])
    .withMessage(`Saving plan must be one of: ${SAVING_PLAN.join(', ')}`),

  body('savingType')
    .notEmpty()
    .withMessage('Saving type is required')
    .custom((value, { req }) => {
      const allowedTypes =
        req.body.savingPlan === 'fantasy-savings'
          ? [...SAVING_TYPE, 'win-trigger']
          : [...SAVING_TYPE];
      if (!allowedTypes.includes(value)) {
        throw new Error(`Saving type must be one of: ${allowedTypes.join(', ')}`);
      }
      return true;
    }),

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

  body('debitScheduleTime')
    .if(body('savingPlan').equals('vault'))
    .notEmpty()
    .withMessage('Debit schedule time is required (e.g. "08:00 AM")'),

  // Fantasy-savings specific
  body('teamName')
    .if(body('savingPlan').equals('fantasy-savings'))
    .notEmpty()
    .withMessage('Team name is required for fantasy-savings plans')
    .trim(),

  validate,
];
