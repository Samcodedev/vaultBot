import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import prisma from '../config/db.js';
import {
  getUserValidator,
  loginUserValidator,
  registerUserValidator,
} from '../middlewares/validators/auth.validator.js';
import type { LoginUserInput, RegisterUserInput, UserPayload, UserResponse } from '../../../../types/index.js';
import type { UserRecord } from '../types';
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED, CONFLICT, NOT_FOUND, logger } from '../utils';
import { generateToken } from '../services';
import { comparePasswords, hashPassword } from '../services';

// type UserRecord = {
//   id: number;
//   name: string | null;
//   email: string;
//   phoneNumber: string | null;
//   createdAt: Date;
//   updatedAt: Date;
//   password?: string;
// };

const formatUser = (user: UserRecord): UserResponse => ({
  id: user.id,
  name: user.name || '',
  email: user.email,
  phoneNumber: user.phoneNumber,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phoneNumber }: RegisterUserInput = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(CONFLICT.STATUS_CODE).json({ 
        error: CONFLICT.ERROR, 
        message: 'Email already registered' 
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phoneNumber: phoneNumber ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    logger.error('Error in registerUser:', error);
    return res.status(INTERNAL_SERVER_ERROR.STATUS_CODE).json({ error: INTERNAL_SERVER_ERROR.ERROR});
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginUserInput = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
        return res.status(NOT_FOUND.STATUS_CODE).json({ error: NOT_FOUND.ERROR, message: 'User not found' });
    }

    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      return res.status(UNAUTHORIZED.STATUS_CODE).json({ error: UNAUTHORIZED.ERROR, message: 'Invalid email or password' });
    }

    const payload = {
      id: user.id.toString(),
      name: user.name || '',
      email: user.email,
    };

    const token = generateToken(payload);

    return res.status(200).json({ 
        success: true, 
        message: 'Login successful', 
        token,
        data: { payload } 
    });
  } catch (error) {
    logger.error('Error in loginUser:', error);
    return res.status(INTERNAL_SERVER_ERROR.STATUS_CODE).json({ error: INTERNAL_SERVER_ERROR.ERROR });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(NOT_FOUND.STATUS_CODE).json({ error: NOT_FOUND.ERROR, message: 'User not found' });
    }

    return res.status(200).json({ success: true, message: 'User fetched successfully', data: formatUser(user) });
  } catch (error) {
    logger.error('Error in getUser:', error);
    return res.status(INTERNAL_SERVER_ERROR.STATUS_CODE).json({ error: INTERNAL_SERVER_ERROR.ERROR });
  }
};

export { getUserValidator, loginUserValidator, registerUserValidator };