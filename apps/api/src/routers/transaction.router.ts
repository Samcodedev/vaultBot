import { Router } from 'express';

import {
  createTransaction,
  getTransactions,
  getTransactionsByPlanId,
} from '../controllers/transaction.controller.js';
import { authenticateUser } from '../middlewares/index.js';
import { createTransactionValidator } from '../middlewares/validators/index.js';

const router = Router();

router.use(authenticateUser);

router.post('/', createTransactionValidator, createTransaction);
router.get('/', getTransactions);
router.get('/plan/:planId', getTransactionsByPlanId);

export default router;
