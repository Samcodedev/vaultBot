import crypto from 'crypto';

import type { Request, Response } from 'express';

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
const USER_NOT_FOUND = 'User not found';

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(NOT_FOUND.STATUS_CODE).json({
        success: false,
        message: USER_NOT_FOUND,
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

    const result = await createVirtualAccount({
      userId,
      fullName,
    });

    if (result.code !== '00' && result.code !== '200') {
      return res.status(BAD_REQUEST.STATUS_CODE).json({
        success: false,
        message: result.description || 'Failed to create virtual account with Nomba',
      });
    }

    const { bankAccountNumber, accountHolderId, bankName, bankAccountName } = result.data;

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: USER_NOT_FOUND,
      });
    }

    const plan = await prisma.plan.findFirst({
      where: { id: planId, userId },
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: SAVINGS_PLAN_NOT_FOUND,
      });
    }

    const freqMap: Record<string, string> = {
      daily: 'DAILY',
      weekly: 'WEEKLY',
      monthly: 'MONTHLY',
      yearly: 'YEARLY',
    };
    const frequency = freqMap[plan.savingType.toLowerCase()] || 'WEEKLY';

    const startDateStr = plan.startDate.toISOString().substring(0, 16);
    const endDateStr = plan.endDate.toISOString().substring(0, 16);

    const merchantReference = `VB-MANDATE-${plan.id}-${Date.now()}`;

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

    const response = await getNombaMandateStatus(plan.mandateId);

    const { mandateStatus, mandateAdviceStatus } = response.data;

    const isActive = mandateStatus === 'ACTIVE' && mandateAdviceStatus === 'ADVICE_SENT';

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

    const response = await debitNombaMandate(plan.mandateId, plan.amount);

    if (response.code !== '00' && response.code !== '200' && response.data?.status !== 'SUCCESS') {
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

export const handleNombaWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers['nomba-signature'] || req.headers['x-nomba-signature'];
    const secret = process.env.NOMBA_WEBHOOK_SECRET || process.env.NOMBA_CLIENT_SECRET || 'secret';

    let isSignatureValid = false;
    const reqWithRawBody = req as Request & { rawBody?: string };
    if (signature && reqWithRawBody.rawBody) {
      try {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(reqWithRawBody.rawBody);
        const calculatedSignature = hmac.digest('hex');
        isSignatureValid = calculatedSignature === signature;
      } catch (err) {
        logger.error('Error verifying Nomba webhook signature:', err);
      }
    }

    if (!isSignatureValid && process.env.NODE_ENV === 'production') {
      logger.error('Invalid signature for Nomba webhook in production environment');
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid signature' });
    } else if (!isSignatureValid) {
      logger.warn(
        'Nomba webhook signature verification failed/missing in non-production, proceeding anyway.',
      );
    }

    const event = req.body;
    logger.info(`Received Nomba webhook payload: ${JSON.stringify(event, null, 2)}`);

    const isPaymentSuccess =
      event.event_type === 'payment_success' || event.eventType === 'payment_success';
    const isDirectData =
      event.accountNumber ||
      event.virtualAccountNumber ||
      event.bankAccountNumber ||
      event.customerAccountNumber;

    if (!isPaymentSuccess && !isDirectData) {
      logger.info(`Ignored Nomba webhook event type: ${event.event_type || event.eventType}`);
      return res.status(200).json({ success: true, message: 'Event ignored' });
    }

    const eventData = event.data || event || {};
    const orderData = eventData.order || event.order || {};
    const txDetails = eventData.transactionDetails || event.transactionDetails || {};

    const accountNumber =
      eventData.accountNumber ||
      eventData.virtualAccountNumber ||
      eventData.bankAccountNumber ||
      eventData.customerAccountNumber ||
      orderData.accountNumber ||
      txDetails.accountNumber ||
      event.accountNumber ||
      event.virtualAccountNumber ||
      event.bankAccountNumber ||
      event.customerAccountNumber;

    const accountId =
      eventData.accountId ||
      eventData.accountRef ||
      orderData.accountRef ||
      eventData.accountHolderId ||
      event.accountId ||
      event.accountRef ||
      event.accountHolderId;

    const amountValue =
      eventData.amount ||
      orderData.amount ||
      eventData.amountPaid ||
      event.amount ||
      event.amountPaid;
    const amount = amountValue ? parseFloat(amountValue) : 0;

    const narration =
      eventData.narration ||
      orderData.narration ||
      eventData.description ||
      orderData.description ||
      event.narration ||
      event.description ||
      '';

    if (!accountNumber && !accountId) {
      logger.warn('Nomba webhook payload missing accountNumber and accountId');
      return res
        .status(400)
        .json({ success: false, message: 'Missing accountNumber or accountId' });
    }

    if (amount <= 0) {
      logger.warn(`Nomba webhook: Invalid amount ${amount}`);
      return res.status(400).json({ success: false, message: 'Invalid transaction amount' });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [...(accountNumber ? [{ accountNumber }] : []), ...(accountId ? [{ accountId }] : [])],
      },
    });

    if (!user) {
      logger.warn(
        `Nomba webhook: User not found for accountNumber: ${accountNumber}, accountId: ${accountId}`,
      );
      return res.status(404).json({ success: false, message: USER_NOT_FOUND });
    }

    const plans = await prisma.plan.findMany({
      where: { userId: user.id },
    });

    if (plans.length === 0) {
      logger.warn(`Nomba webhook: No savings plans found for user ID: ${user.id}`);
      return res.status(404).json({ success: false, message: 'No savings plans found' });
    }

    let plan = null;

    if (narration) {
      const uuidRegex = /[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i;
      const matched = narration.match(uuidRegex);
      if (matched) {
        const matchedPlanId = matched[0];
        const normalizeId = (idStr: string) => idStr.replace(/-/g, '').toLowerCase();
        plan = plans.find((p) => normalizeId(p.id) === normalizeId(matchedPlanId));
      }
    }

    if (!plan && narration) {
      plan = plans.find((p) => narration.toLowerCase().includes(p.name.toLowerCase()));
    }

    if (!plan && plans.length === 1) {
      plan = plans[0];
    }

    if (!plan) {
      plan = plans.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      logger.info(
        `Nomba webhook: Multiple plans found, but no direct match in narration "${narration}". Defaulting to most recently updated plan: ${plan.name} (${plan.id})`,
      );
    }

    const [updatedPlan, transaction] = await prisma.$transaction([
      prisma.plan.update({
        where: { id: plan.id },
        data: {
          currentBalance: {
            increment: amount,
          },
        },
      }),
      prisma.transaction.create({
        data: {
          planId: plan.id,
          userId: user.id,
          amount: amount,
          type: 'deposit',
          status: 'completed',
        },
      }),
    ]);

    logger.info(
      `Successfully processed manual top-up of ${amount} for plan ${plan.name} (user: ${user.email}) via Nomba webhook`,
    );

    return res.status(200).json({
      success: true,
      message: 'Manual top-up processed successfully',
      data: {
        planId: plan.id,
        planTitle: plan.name,
        newBalance: updatedPlan.currentBalance,
        transactionId: transaction.id,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error in handleNombaWebhook controller:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'An unexpected error occurred while processing webhook payment',
    });
  }
};
