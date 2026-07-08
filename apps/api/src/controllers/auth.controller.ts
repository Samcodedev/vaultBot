import type { Request, Response } from 'express';

import type { LoginUserInput, RegisterUserInput, UserResponse } from '../../../../types/index.js';
import prisma from '../config/db.js';
import { generateToken, comparePasswords, hashPassword } from '../services';
import type { UserRecord } from '../types';
import type { AuthenticatedRequest } from '../types/index.js';
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED, CONFLICT, NOT_FOUND, logger } from '../utils';

const formatUser = (user: UserRecord): UserResponse => ({
  id: user.id,
  firstName: user.firstName || '',
  lastName: user.lastName || '',
  email: user.email,
  phoneNumber: user.phoneNumber,
  accountNumber: user.accountNumber || '',
  accountId: user.accountId || '',
  bankAccountName: user.bankAccountName || '',
  bankName: user.bankName || '',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password, phoneNumber }: RegisterUserInput = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(CONFLICT.STATUS_CODE).json({
        error: CONFLICT.ERROR,
        message: 'Email already registered',
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phoneNumber: phoneNumber ?? null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        accountNumber: true,
        accountId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const payload = {
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
    };

    const token = generateToken(payload);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (error) {
    logger.error('Error in registerUser:', error);
    return res
      .status(INTERNAL_SERVER_ERROR.STATUS_CODE)
      .json({ error: INTERNAL_SERVER_ERROR.ERROR });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginUserInput = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        phoneNumber: true,
        accountNumber: true,
        accountId: true,
        bankAccountName: true,
        bankName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res
        .status(NOT_FOUND.STATUS_CODE)
        .json({ error: NOT_FOUND.ERROR, message: NOT_FOUND.USER_NOT_FOUND });
    }

    const isPasswordValid = await comparePasswords(password, user.password);

    if (!isPasswordValid) {
      return res
        .status(UNAUTHORIZED.STATUS_CODE)
        .json({ error: UNAUTHORIZED.ERROR, message: 'Invalid email or password' });
    }

    const payload = {
      id: user.id,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
    };

    const token = generateToken(payload);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUser(user),
    });
  } catch (error) {
    logger.error('Error in loginUser:', error);
    return res
      .status(INTERNAL_SERVER_ERROR.STATUS_CODE)
      .json({ error: INTERNAL_SERVER_ERROR.ERROR });
  }
};

export const getUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(UNAUTHORIZED.STATUS_CODE).json({
        error: UNAUTHORIZED.ERROR,
        message: 'User not authenticated',
      });
    }

    const { id } = req.user;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        accountNumber: true,
        accountId: true,
        bankAccountName: true,
        bankName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res
        .status(NOT_FOUND.STATUS_CODE)
        .json({ error: NOT_FOUND.ERROR, message: NOT_FOUND.USER_NOT_FOUND });
    }

    return res
      .status(200)
      .json({ success: true, message: 'User fetched successfully', data: formatUser(user) });
  } catch (error) {
    logger.error('Error in getUser:', error);
    return res
      .status(INTERNAL_SERVER_ERROR.STATUS_CODE)
      .json({ error: INTERNAL_SERVER_ERROR.ERROR });
  }
};

export const verifyUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res
        .status(NOT_FOUND.STATUS_CODE)
        .json({ error: NOT_FOUND.ERROR, message: NOT_FOUND.USER_NOT_FOUND });
    }

    // send a mail to the user with a verification link or code (not implemented here)

    return res.status(200).json({
      success: true,
      message: 'Check your email for verification instructions',
    });
  } catch (error) {
    logger.error('Error in verifyUser:', error);
    return res
      .status(INTERNAL_SERVER_ERROR.STATUS_CODE)
      .json({ error: INTERNAL_SERVER_ERROR.ERROR });
  }
};
