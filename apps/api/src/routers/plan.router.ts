import { Router } from 'express';

import {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} from '../controllers/plan.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';
import { createPlanValidator, updatePlanValidator } from '../middlewares/validators/index.js';

const router = Router();

router.post('/', authenticateUser, createPlanValidator, createPlan);
router.get('/', authenticateUser, getPlans);
router.get('/:id', authenticateUser, getPlanById);
router.put('/:id', authenticateUser, updatePlanValidator, updatePlan);
router.delete('/:id', authenticateUser, deletePlan);

export default router;
