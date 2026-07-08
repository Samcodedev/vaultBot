import type { Response } from 'express';

import prisma from '../config/db.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { INTERNAL_SERVER_ERROR, NOT_FOUND, UNAUTHORIZED_ACCESS, logger } from '../utils/index.js';

export const createTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { planId, amount, type } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: UNAUTHORIZED_ACCESS,
      });
    }

    const amountVal = parseFloat(amount);

    // 1. Verify plan exists and belongs to this user
    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      return res.status(NOT_FOUND.STATUS_CODE).json({
        success: false,
        message: 'Savings plan not found',
      });
    }

    // 2. Perform transaction creation and balance increment in a database transaction
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          planId,
          userId,
          amount: amountVal,
          type,
          status: 'completed',
        },
        include: {
          plan: true,
        },
      }),
      prisma.plan.update({
        where: { id: planId },
        data: {
          currentBalance: {
            increment: amountVal,
          },
        },
      }),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully',
      data: {
        id: transaction.id,
        planTitle: transaction.plan.name,
        planId: transaction.planId,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        date: transaction.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error in createTransaction:', err);
    return res.status(INTERNAL_SERVER_ERROR.STATUS_CODE).json({
      success: false,
      error: INTERNAL_SERVER_ERROR.ERROR,
      message: 'An unexpected error occurred while creating transaction',
    });
  }
};

export const getTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: UNAUTHORIZED_ACCESS,
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
      },
    });

    const mapped = transactions.map((tx) => ({
      id: tx.id,
      planTitle: tx.plan.name,
      planId: tx.planId,
      amount: tx.amount,
      type: tx.type,
      status: tx.status,
      date: tx.createdAt.toISOString(),
    }));

    return res.status(200).json({
      success: true,
      data: mapped,
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error in getTransactions:', err);
    return res.status(INTERNAL_SERVER_ERROR.STATUS_CODE).json({
      success: false,
      error: INTERNAL_SERVER_ERROR.ERROR,
      message: 'An unexpected error occurred while fetching transactions',
    });
  }
};

export const getTransactionsByPlanId = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const planId = req.params.planId as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: UNAUTHORIZED_ACCESS,
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: { planId, userId },
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
      },
    });

    const mapped = transactions.map((tx) => ({
      id: tx.id,
      planTitle: tx.plan.name,
      planId: tx.planId,
      amount: tx.amount,
      type: tx.type,
      status: tx.status,
      date: tx.createdAt.toISOString(),
    }));

    return res.status(200).json({
      success: true,
      data: mapped,
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error in getTransactionsByPlanId:', err);
    return res.status(INTERNAL_SERVER_ERROR.STATUS_CODE).json({
      success: false,
      error: INTERNAL_SERVER_ERROR.ERROR,
      message: 'An unexpected error occurred while fetching plan transactions',
    });
  }
};
