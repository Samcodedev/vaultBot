import { Router } from 'express';

import authRouter from './auth.router.js';
import nombaRouter from './nomba.router.js';
import notificationRouter from './notification.router.js';
import planRouter from './plan.router.js';
import transactionRouter from './transaction.router.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/plans', planRouter);
router.use('/nomba', nombaRouter);
router.use('/transactions', transactionRouter);
router.use('/notifications', notificationRouter);

export default router;

