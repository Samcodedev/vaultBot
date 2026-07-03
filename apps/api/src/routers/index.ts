import { Router } from 'express';

import authRouter from './auth.router.js';
import planRouter from './plan.router.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/plans', planRouter);

export default router;
