import type { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';

import type { UserPayload } from '../../../../types/auth.type.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { UNAUTHORIZED } from '../utils/constant.utils.js';
import logger from '../utils/logger.js';

export const authenticateUser = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(UNAUTHORIZED.STATUS_CODE).json({
      error: UNAUTHORIZED.ERROR,
      message: 'Bearer token is required',
    });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(UNAUTHORIZED.STATUS_CODE).json({
      error: UNAUTHORIZED.ERROR,
      message: 'Bearer token is required',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as UserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Error in authenticateUser:', error);
    return res.status(UNAUTHORIZED.STATUS_CODE).json({
      error: UNAUTHORIZED.ERROR,
      message: 'Invalid or expired token',
    });
  }
};
