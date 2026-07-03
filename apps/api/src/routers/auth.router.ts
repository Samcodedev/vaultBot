import { Router } from 'express';

import { getUser, loginUser, registerUser, verifyUser } from '../controllers/auth.controller.js';
import { authenticateUser } from '../middlewares/index.js';
import { loginUserValidator, registerUserValidator } from '../middlewares/validators/index.js';

const router = Router();

router.post('/register', registerUserValidator, registerUser);
router.post('/login', loginUserValidator, loginUser);
router.get('/', authenticateUser, getUser);
router.post('/verify', verifyUser);

export default router;
