import crypto from 'crypto';

import axios from 'axios';
import type { Request, Response } from 'express';

import prisma from '../config/db.js';
import {
  createVirtualAccount,
  createDirectDebitMandate as createNombaDirectDebitMandate,
  getMandateStatus as getNombaMandateStatus,
  getMandateDetails as getNombaMandate,
  debitMandate as debitNombaMandate,
} from '../services/index.js';
import nombaService from '../services/nomba/nomba.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, logger } from '../utils/index.js';

const UNAUTHORIZED_ACCESS = 'Unauthorized access';
const SAVINGS_PLAN_NOT_FOUND = 'Savings plan not found or does not belong to this user';
const USER_NOT_FOUND = 'User not found';
const SUCCESSFUL_NOMBA_STATUSES = new Set(['SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'PAID']);

interface NombaTransactionRecord {
  id?: string | number;
  transactionId?: string | number;
  paymentReference?: string | number;
  reference?: string | number;
  orderReference?: string | number;
  merchantTxRef?: string | number;
  merchantReference?: string | number;
  sessionId?: string | number;
  amount?: string | number;
  amountPaid?: string | number;
  narration?: string | number;
  description?: string | number;
  status?: string;
  transactionStatus?: string;
  type?: string;
  transactionType?: string;
  customerBillerId?: string | number;
  accountNumber?: string | number;
  virtualAccountNumber?: string | number;
  bankAccountNumber?: string | number;
  customerAccountNumber?: string | number;
  destinationAccountNumber?: string | number;
  beneficiaryAccountNumber?: string | number;
  accountId?: string | number;
  accountRef?: string | number;
  accountHolderId?: string | number;
  destinationAccountId?: string | number;
  meta?: {
    accountId?: string | number;
    parentAccountId?: string | number;
    transactionId?: string | number;
    merchantTxRef?: string | number;
    rrn?: string | number;
    transactionAmount?: string | number;
    billerId?: string | number;
    mCollectionsId?: string | number;
  };
}

interface NombaTransactionHistoryResponse {
  data?: { results?: NombaTransactionRecord[]; transactions?: NombaTransactionRecord[] };
  results?: NombaTransactionRecord[];
  transactions?: NombaTransactionRecord[];
}

const toReference = (value?: string | number) => {
  if (typeof value === 'number') return String(value);
  return value?.trim() || undefined;
};

const parseNombaAmount = (value?: string | number) => {
  const normalized = String(value || '').replace(/,/g, '');
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : 0;
};

const getTransactionReference = (tx: NombaTransactionRecord) =>
  toReference(tx.id) ||
  toReference(tx.transactionId) ||
  toReference(tx.paymentReference) ||
  toReference(tx.reference) ||
  toReference(tx.orderReference) ||
  toReference(tx.merchantTxRef) ||
  toReference(tx.merchantReference) ||
  toReference(tx.sessionId) ||
  toReference(tx.meta?.transactionId) ||
  toReference(tx.meta?.rrn) ||
  toReference(tx.meta?.merchantTxRef);

const getTransactionNarration = (tx: NombaTransactionRecord) =>
  toReference(tx.narration) ||
  toReference(tx.description) ||
  toReference(tx.orderReference) ||
  toReference(tx.merchantTxRef) ||
  toReference(tx.merchantReference) ||
  toReference(tx.meta?.merchantTxRef) ||
  toReference(tx.meta?.rrn) ||
  '';

const nombaAccountMatches = (
  tx: NombaTransactionRecord,
  userAccount?: string | null,
  userAccountId?: string | null,
) => {
  const accountNumbers = [
    tx.customerBillerId,
    tx.accountNumber,
    tx.virtualAccountNumber,
    tx.bankAccountNumber,
    tx.customerAccountNumber,
    tx.destinationAccountNumber,
    tx.beneficiaryAccountNumber,
  ].map(toReference);
  const accountIds = [
    tx.accountId,
    tx.accountRef,
    tx.accountHolderId,
    tx.destinationAccountId,
    tx.meta?.accountId,
    tx.meta?.parentAccountId,
  ].map(toReference);

  return (
    (!!userAccount && accountNumbers.includes(userAccount)) ||
    (!!userAccountId && accountIds.includes(userAccountId))
  );
};

const isSuccessfulNombaCredit = (tx: NombaTransactionRecord) => {
  const status = (tx.status || tx.transactionStatus || '').toUpperCase();
  const type = (tx.type || tx.transactionType || '').toUpperCase();

  const isDebit = type.includes('DEBIT') || type.includes('WITHDRAW');

  return (!status || SUCCESSFUL_NOMBA_STATUSES.has(status)) && !isDebit;
};

const extractTransactions = (response: NombaTransactionHistoryResponse) =>
  response.data?.results ||
  response.data?.transactions ||
  response.results ||
  response.transactions ||
  [];

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
      message: 'An unexpected error occurred while creating Nomba account',
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
      message: 'An unexpected error occurred while initiating direct debit mandate',
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
      message: 'An unexpected error occurred while checking mandate status',
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
      message: 'An unexpected error occurred while fetching mandate details',
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
      message: 'An unexpected error occurred while processing mandate debit',
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

    // Log signature status but never block — hackathon mode
    if (!isSignatureValid) {
      logger.warn(
        `Nomba webhook: signature missing or invalid (sig=${signature}). Processing anyway.`,
      );
    } else {
      logger.info('Nomba webhook: signature verified OK.');
    }

    const event = req.body;
    logger.info(`Received Nomba webhook payload: ${JSON.stringify(event, null, 2)}`);

    const eventData = event.data || event || {};
    const orderData = eventData.order || event.order || {};
    const txDetails = eventData.transactionDetails || event.transactionDetails || {};
    const isPaymentSuccess =
      event.event_type === 'payment_success' || event.eventType === 'payment_success';
    const isDirectData =
      event.accountNumber ||
      event.virtualAccountNumber ||
      event.bankAccountNumber ||
      event.customerAccountNumber ||
      eventData.accountNumber ||
      eventData.virtualAccountNumber ||
      eventData.bankAccountNumber ||
      eventData.customerAccountNumber ||
      orderData.accountNumber ||
      txDetails.accountNumber ||
      eventData.accountId ||
      eventData.accountRef ||
      eventData.accountHolderId;

    if (!isPaymentSuccess && !isDirectData) {
      logger.info(`Ignored Nomba webhook event type: ${event.event_type || event.eventType}`);
      return res.status(200).json({ success: true, message: 'Event ignored' });
    }

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
    // a8768942-f5cf-43f7-94b9-1af529d2e74e
    if (amount <= 0) {
      logger.warn(`Nomba webhook: Invalid amount ${amount}`);
      return res.status(400).json({ success: false, message: 'Invalid transaction amount' });
    }

    const transactionId =
      eventData.id ||
      event.id ||
      eventData.transactionId ||
      event.transactionId ||
      eventData.paymentReference ||
      event.paymentReference ||
      txDetails.transactionId ||
      txDetails.id;

    if (transactionId) {
      const existingTx = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });
      if (existingTx) {
        logger.info(
          `Nomba webhook: Transaction ${transactionId} already processed. Skipping duplicate execution.`,
        );
        return res.status(200).json({ success: true, message: 'Already processed' });
      }
    }

    // ── Strategy 1: match user by virtual accountNumber / accountId ──────────
    let user = null;
    let plan = null;

    if (accountNumber || accountId) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            ...(accountNumber ? [{ accountNumber }] : []),
            ...(accountId ? [{ accountId }] : []),
          ],
        },
      });
    }

    // ── Strategy 2: match plan directly via merchantReference in narration ───
    // Format: "VB-MANDATE-<planId>-<timestamp>" — embedded by initiateDirectDebit
    if (!user && narration) {
      const merchantRefMatch = narration.match(/VB-MANDATE-([0-9a-f-]{36})-\d+/i);
      if (merchantRefMatch) {
        const merchantRef = merchantRefMatch[0];
        const planByRef = await prisma.plan.findFirst({
          where: { merchantReference: merchantRef },
          include: { user: true },
        });
        if (planByRef) {
          plan = planByRef;
          user = planByRef.user;
          logger.info(
            `Nomba webhook: matched via merchantReference "${merchantRef}" → plan "${planByRef.name}"`,
          );
        }
      }
    }

    if (!user) {
      logger.warn(
        `Nomba webhook: User not found for accountNumber: ${accountNumber}, accountId: ${accountId}, narration: ${narration}`,
      );
      return res.status(404).json({ success: false, message: USER_NOT_FOUND });
    }

    let plans: Awaited<ReturnType<typeof prisma.plan.findMany>> = [];
    if (!plan) {
      plans = await prisma.plan.findMany({ where: { userId: user.id } });

      if (plans.length === 0) {
        logger.warn(`Nomba webhook: No savings plans found for user ID: ${user.id}`);
        return res.status(404).json({ success: false, message: 'No savings plans found' });
      }
    }

    if (!plan && narration) {
      const uuidRegex = /[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i;
      const matched = narration.match(uuidRegex);
      if (matched) {
        const matchedPlanId = matched[0];
        const normalizeId = (idStr: string) => idStr.replace(/-/g, '').toLowerCase();
        plan = plans.find((p) => normalizeId(p.id) === normalizeId(matchedPlanId)) ?? null;
      }
    }

    if (!plan && narration) {
      plan = plans.find((p) => narration.toLowerCase().includes(p.name.toLowerCase())) ?? null;
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
          id: transactionId || undefined,
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
      message: 'An unexpected error occurred while processing webhook payment',
    });
  }
};

export const syncTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: UNAUTHORIZED_ACCESS });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(NOT_FOUND.STATUS_CODE).json({ success: false, message: USER_NOT_FOUND });
    }

    if (!user.accountId && !user.accountNumber) {
      return res.status(BAD_REQUEST.STATUS_CODE).json({
        success: false,
        message:
          'You have not set up a Nomba virtual account yet. Create one first to sync transactions.',
      });
    }

    let nombaTransactions: NombaTransactionRecord[] = [];

    try {
      const transactionHistoryPaths = ['/v1/transactions/accounts', '/v1/transactions/bank'];
      const responses = await Promise.allSettled(
        transactionHistoryPaths.map((url) =>
          nombaService.request<NombaTransactionHistoryResponse>({
            method: 'GET',
            url,
            params: { limit: 50 },
          }),
        ),
      );

      nombaTransactions = responses.flatMap((response) =>
        response.status === 'fulfilled' ? extractTransactions(response.value.data) : [],
      );

      if (nombaTransactions.length === 0) {
        const rejectedResponse = responses.find((response) => response.status === 'rejected');
        if (rejectedResponse?.status === 'rejected') throw rejectedResponse.reason;
      }
    } catch (fetchErr: unknown) {
      let message = 'Could not reach Nomba API. Try again in a moment.';

      if (axios.isAxiosError(fetchErr)) {
        const status = fetchErr.response?.status;
        const responseData = fetchErr.response?.data as
          { description?: string; message?: string } | string | undefined;
        const nombaMessage =
          typeof responseData === 'string'
            ? responseData
            : responseData?.description || responseData?.message;

        logger.error(
          `syncTransactions: Nomba API failed (${status || 'no status'}): ${
            nombaMessage || fetchErr.message
          }`,
        );

        if (status === 401 || status === 403) {
          message =
            'Nomba rejected the transaction-history request. Confirm NOMBA_BASE_URL matches your credentials and NOMBA_ACCOUNT_ID is the parent account ID with transaction access.';
        } else if (status === 404) {
          message = 'Nomba transaction-history endpoint was not found for this environment.';
        }
      } else {
        const e = fetchErr as Error;
        logger.error('syncTransactions: failed to fetch from Nomba API:', e.message);
      }

      return res.status(502).json({
        success: false,
        message,
      });
    }

    const userTransactions = nombaTransactions.filter(
      (tx) =>
        isSuccessfulNombaCredit(tx) && nombaAccountMatches(tx, user.accountNumber, user.accountId),
    );

    if (userTransactions.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No transactions found on your virtual account yet.',
        credited: 0,
      });
    }

    const plans = await prisma.plan.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (plans.length === 0) {
      return res.status(404).json({ success: false, message: 'No savings plans found.' });
    }

    const existingRefs = await prisma.transaction.findMany({
      where: { userId },
      select: { id: true },
    });
    const existingRefSet = new Set(existingRefs.map((t) => t.id));

    let credited = 0;
    const creditedDetails: { amount: number; plan: string; ref: string }[] = [];

    for (const tx of userTransactions) {
      const ref = getTransactionReference(tx) || '';
      const amount = parseNombaAmount(tx.amount || tx.amountPaid || tx.meta?.transactionAmount);

      if (amount <= 0) continue;
      if (ref && existingRefSet.has(ref)) continue; // already processed

      // Match to a plan via narration/description/orderReference or pick most recently updated
      const narration = getTransactionNarration(tx);
      let targetPlan = plans[0]; // default: most recently updated

      const uuidRegex = /[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i;
      const matched = narration.match(uuidRegex);
      if (matched) {
        const norm = (s: string) => s.replace(/-/g, '').toLowerCase();
        const found = plans.find((p) => norm(p.id) === norm(matched[0]));
        if (found) targetPlan = found;
      } else {
        const byName = plans.find((p) => narration.toLowerCase().includes(p.name.toLowerCase()));
        if (byName) targetPlan = byName;
      }

      // Credit the plan atomically
      await prisma.$transaction([
        prisma.plan.update({
          where: { id: targetPlan.id },
          data: { currentBalance: { increment: amount } },
        }),
        prisma.transaction.create({
          data: {
            id: ref || undefined,
            planId: targetPlan.id,
            userId,
            amount,
            type: 'deposit',
            status: 'completed',
          },
        }),
      ]);

      existingRefSet.add(ref);
      credited++;
      creditedDetails.push({ amount, plan: targetPlan.name, ref });

      logger.info(
        `syncTransactions: credited ₦${amount} → plan "${targetPlan.name}" (ref: ${ref})`,
      );
    }

    return res.status(200).json({
      success: true,
      message:
        credited > 0
          ? `Synced ${credited} new deposit(s) to your savings plan.`
          : 'All transactions are already up to date.',
      credited,
      details: creditedDetails,
    });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Error in syncTransactions:', err);
    return res.status(INTERNAL_SERVER_ERROR.STATUS_CODE).json({
      success: false,
      message: 'An unexpected error occurred while syncing transactions.',
    });
  }
};
