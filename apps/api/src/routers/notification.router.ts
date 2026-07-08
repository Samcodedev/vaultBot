import { Router } from 'express';

import { getNotifications } from '../controllers/notification.controller.js';
import { authenticateUser } from '../middlewares/index.js';

const router = Router();

router.use(authenticateUser);
router.get('/', getNotifications);

export default router;
