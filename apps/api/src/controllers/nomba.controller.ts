import type { Response } from 'express';

import prisma from '../config/db.js';
import {
  createVirtualAccount,
  createDirectDebitMandate as createNombaDirectDebitMandate,
  getMandateStatus as getNombaMandateStatus,
  getMandateDetails as getNombaMandate,
  debitMandate as debitNombaMandate,
} from '../services/index.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, logger } from '../utils/index.js';

const UNAUTHORIZED_ACCESS = 'Unauthorized access';
const SAVINGS_PLAN_NOT_FOUND = 'Savings plan not found or does not belong to this user';

export const createNombaAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { fullName } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: UNAUTHORIZED_ACCESS,
      });
    }

    // 1. Fetch user to check if they already have a virtual account
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(NOT_FOUND.STATUS_CODE).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.accountNumber) {
      return res.status(BAD_REQUEST.STATUS_CODE).json({
        success: false,
        message: 'Nomba virtual account has already been created for this user',
        data: {
          accountNumber: user.accountNumber,
          accountId: user.accountId,
        },
      });
    }

    // 2. Call Nomba API to create virtual account
    const result = await createVirtualAccount({
      userId,
      fullName,
    });

    // Nomba's API response structure: { code: "00", description: "Success", data: { bankAccountNumber: "...", accountHolderId: "...", bankName: "..." } }
    if (result.code !== '00' && result.code !== '200') {
      return res.status(BAD_REQUEST.STATUS_CODE).json({
        success: false,
        message: result.description || 'Failed to create virtual account with Nomba',
      });
    }

    const { bankAccountNumber, accountHolderId, bankName, bankAccountName } = result.data;

    // 3. Update user record in DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        accountNumber: bankAccountNumber,
        accountId: accountHolderId,
        bankAccountName,
        bankName,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        accountNumber: true,
        accountId: true,
        bankAccountName: true,
        bankName: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Nomba virtual account created successfully',
      data: {
        user: updatedUser,
        bankAccountNumber,
        bankAccountName,
        bankName,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error in createNombaAccount controller:', err);
    return res.status(INTERNAL_SERVER_ERROR.STATUS_CODE).json({
      success: false,
      error: INTERNAL_SERVER_ERROR.ERROR,
      message: err.message || 'An unexpected error occurred while creating Nomba account',
    });
  }
};

export const initiateDirectDebit = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { planId, customerAccountNumber, bankCode, customerAddress, customerAccountName } =
      req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: UNAUTHORIZED_ACCESS,
      });
    }

    // 1. Fetch user to get details
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // 2. Fetch the plan
    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: SAVINGS_PLAN_NOT_FOUND,
      });
    }

    // Map frequency (savingType) to Nomba's frequency
    const freqMap: Record<string, string> = {
      daily: 'DAILY',
      weekly: 'WEEKLY',
      monthly: 'MONTHLY',
      yearly: 'YEARLY',
    };
    const frequency = freqMap[plan.savingType.toLowerCase()] || 'WEEKLY';

    // Format dates to YYYY-MM-DDTHH:mm
    const startDateStr = plan.startDate.toISOString().substring(0, 16);
    const endDateStr = plan.endDate.toISOString().substring(0, 16);

    const merchantReference = `VB-MANDATE-${plan.id}-${Date.now()}`;

    // 3. Make Nomba API Call
    const payload = {
      customerAccountNumber,
      bankCode,
      customerName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'VaultBot Customer',
      customerAddress: customerAddress || 'Lagos',
      customerAccountName,
      amount: plan.amount,
      frequency,
      narration: `VaultBot Concurrent Savings: ${plan.name}`,
      customerPhoneNumber: user.phoneNumber || '08000000000',
      merchantReference,
      startDate: startDateStr,
      endDate: endDateStr,
      customerEmail: user.email,
      startImmediately: true,
    };

    const response = await createNombaDirectDebitMandate(payload);

    if (response.responseCode !== '00' && response.responseCode !== '200') {
      return res.status(400).json({
        success: false,
        message: response.description || 'Failed to set up direct debit mandate with Nomba',
      });
    }

    const { mandateId, description } = response.data;

    // 4. Update the Plan in DB
    await prisma.plan.update({
      where: { id: planId },
      data: {
        mandateId,
        merchantReference,
        mandateStatus: 'PENDING',
        mandateAdviceStatus: 'PENDING',
        autoSaveEnabled: false,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Direct debit mandate initiated successfully',
      data: {
        mandateId,
        merchantReference,
        validationInstructions: description || 'Transfer N50 to validate mandate...',
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error in initiateDirectDebit controller:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'An unexpected error occurred while initiating direct debit mandate',
    });
  }
};

export const checkMandateStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const planId = req.params.planId as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: UNAUTHORIZED_ACCESS,
      });
    }

    // 1. Fetch the plan
    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: SAVINGS_PLAN_NOT_FOUND,
      });
    }

    if (!plan.mandateId) {
      return res.status(400).json({
        success: false,
        message: 'This savings plan does not have an associated direct debit mandate setup',
      });
    }

    // 2. Fetch status from Nomba
    const response = await getNombaMandateStatus(plan.mandateId);

    const { mandateStatus, mandateAdviceStatus } = response.data;

    // 3. Check if mandate is fully active
    const isActive = mandateStatus === 'ACTIVE' && mandateAdviceStatus === 'ADVICE_SENT';

    // 4. Update the Plan in DB
    const updatedPlan = await prisma.plan.update({
      where: { id: planId },
      data: {
        mandateStatus,
        mandateAdviceStatus,
        autoSaveEnabled: isActive,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Mandate status updated successfully',
      data: {
        mandateId: plan.mandateId,
        mandateStatus,
        mandateAdviceStatus,
        autoSaveEnabled: updatedPlan.autoSaveEnabled,
        isActive,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error in checkMandateStatus controller:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'An unexpected error occurred while checking mandate status',
    });
  }
};

export const getPlanMandateDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const planId = req.params.planId as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: UNAUTHORIZED_ACCESS,
      });
    }

    // 1. Fetch the plan
    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: SAVINGS_PLAN_NOT_FOUND,
      });
    }

    if (!plan.mandateId) {
      return res.status(400).json({
        success: false,
        message: 'This savings plan does not have an associated direct debit mandate setup',
      });
    }

    // 2. Fetch full details from Nomba
    const response = await getNombaMandate(plan.mandateId);

    return res.status(200).json({
      success: true,
      data: {
        planId: plan.id,
        autoSaveEnabled: plan.autoSaveEnabled,
        dbStatus: plan.mandateStatus,
        dbAdviceStatus: plan.mandateAdviceStatus,
        nombaDetails: response.data,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error in getPlanMandateDetails controller:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'An unexpected error occurred while fetching mandate details',
    });
  }
};

export const triggerDebitMandate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const planId = req.params.planId as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: UNAUTHORIZED_ACCESS,
      });
    }

    // 1. Fetch the plan
    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: SAVINGS_PLAN_NOT_FOUND,
      });
    }

    if (!plan.mandateId) {
      return res.status(400).json({
        success: false,
        message: 'Direct debit mandate has not been initiated for this plan',
      });
    }

    if (!plan.autoSaveEnabled) {
      return res.status(400).json({
        success: false,
        message:
          'Direct debit mandate is not active yet. Please complete N50 validation and check mandate status.',
      });
    }

    // 2. Call Nomba API to debit mandate
    const response = await debitNombaMandate(plan.mandateId, plan.amount);

    if (response.code !== '00' && response.code !== '200' && response.data?.status !== 'SUCCESS') {
      // Record failed transaction
      await prisma.transaction.create({
        data: {
          planId: plan.id,
          userId,
          amount: plan.amount,
          type: 'auto-save',
          status: 'failed',
        },
      });

      return res.status(400).json({
        success: false,
        message: response.description || 'Failed to debit mandate with Nomba',
      });
    }

    // 3. On success, update plan balance and record successful transaction inside DB transaction
    const [transaction] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          planId: plan.id,
          userId,
          amount: plan.amount,
          type: 'auto-save',
          status: 'completed',
        },
        include: {
          plan: true,
        },
      }),
      prisma.plan.update({
        where: { id: plan.id },
        data: {
          currentBalance: {
            increment: plan.amount,
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Direct debit mandate processed successfully. Savings plan credited.',
      data: {
        transactionId: transaction.id,
        amount: transaction.amount,
        status: transaction.status,
        planTitle: transaction.plan.name,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error in triggerDebitMandate controller:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'An unexpected error occurred while processing mandate debit',
    });
  }
};
