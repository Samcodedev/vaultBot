import type { Response } from 'express';

import prisma from '../config/db.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED_ACCESS, logger } from '../utils/index.js';

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
};

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: UNAUTHORIZED_ACCESS });
    }

    // Fetch the latest 5 transactions for this user
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { plan: true },
    });

    const amountFmt = (n: number) =>
      new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);

    const notifications = transactions.map((tx) => {
      const isAutoSave = tx.type === 'auto-save';
      const title = isAutoSave ? '⚡ Auto-Save Processed' : '💰 Manual Deposit';
      const desc = `${amountFmt(tx.amount)} ${isAutoSave ? 'automatically debited for' : 'deposited into'} "${tx.plan.name}".`;

      return {
        id: tx.id,
        title,
        desc,
        time: formatRelativeTime(tx.createdAt),
        unread: Date.now() - tx.createdAt.getTime() < 24 * 60 * 60 * 1000, // unread if within 24h
        type: tx.type,
        amount: tx.amount,
        planName: tx.plan.name,
        createdAt: tx.createdAt.toISOString(),
      };
    });

    return res.status(200).json({ success: true, data: notifications });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error in getNotifications:', err);
    return res.status(INTERNAL_SERVER_ERROR.STATUS_CODE).json({
      success: false,
      error: INTERNAL_SERVER_ERROR.ERROR,
      message: 'An unexpected error occurred while fetching notifications',
    });
  }
};
