import { Router } from 'express';

import { createPlan } from '../controllers/plan.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';
import { createPlanValidator } from '../middlewares/validators/index.js';

const router = Router();

router.post('/', authenticateUser, createPlanValidator, createPlan);

export default router;
