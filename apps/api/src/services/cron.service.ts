import { Plan } from '@prisma/client';

import { didTeamWin, getNextFixture } from './fantasy.service.js';
import prisma from '../config/db.js';
import logger from '../utils/logger.js';
import { debitMandate } from './nomba/directDebit.service.js';

function calculateNextDebitDate(currentDate: Date, savingType: string): Date {
  const nextDate = new Date(currentDate);
  if (savingType === 'daily') {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (savingType === 'weekly') {
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (savingType === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (savingType === 'yearly') {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  return nextDate;
}

async function processVaultPlan(plan: Plan) {
  logger.info(
    `[Scheduler] Processing Vault plan ${plan.id} (${plan.name}), amount ₦${plan.amount}`,
  );

  let debitSuccess = false;

  if (plan.autoSaveEnabled && plan.mandateId) {
    // ── Idempotency check: skip if already debited in this cycle ──────────────
    const windowStart = plan.nextDebitDate;
    const windowEnd = calculateNextDebitDate(plan.nextDebitDate, plan.savingType);
    const alreadyDebited = await prisma.transaction.findFirst({
      where: {
        planId: plan.id,
        type: 'auto-save',
        status: 'completed',
        createdAt: { gte: windowStart, lt: windowEnd },
      },
    });

    if (alreadyDebited) {
      logger.info(
        `[Scheduler] Vault plan ${plan.id} already debited this cycle (tx: ${alreadyDebited.id}). Advancing nextDebitDate only.`,
      );
      await prisma.plan.update({
        where: { id: plan.id },
        data: { nextDebitDate: windowEnd },
      });
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    try {
      const debitResponse = await debitMandate(plan.mandateId, plan.amount);
      if (
        debitResponse.code === '00' ||
        debitResponse.code === '200' ||
        debitResponse.data?.status === 'SUCCESS'
      ) {
        debitSuccess = true;
        await prisma.transaction.create({
          data: {
            planId: plan.id,
            userId: plan.userId,
            amount: plan.amount,
            type: 'auto-save',
            status: 'completed',
          },
        });
      } else {
        logger.warn(
          `[Scheduler] Vault debit failed: ${debitResponse.description || 'Unknown error'}`,
        );
        await prisma.transaction.create({
          data: {
            planId: plan.id,
            userId: plan.userId,
            amount: plan.amount,
            type: 'auto-save',
            status: 'failed',
          },
        });
      }
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`[Scheduler] Direct Debit payment failed with error:`, error);
      await prisma.transaction.create({
        data: {
          planId: plan.id,
          userId: plan.userId,
          amount: plan.amount,
          type: 'auto-save',
          status: 'failed',
        },
      });
    }
  } else {
    logger.info(
      `[Scheduler] Vault plan autoSaveEnabled is false or mandateId is missing. Skipping auto debit.`,
    );
  }

  const newNextDebitDate = calculateNextDebitDate(plan.nextDebitDate, plan.savingType);

  await prisma.plan.update({
    where: { id: plan.id },
    data: {
      currentBalance: debitSuccess ? { increment: plan.amount } : undefined,
      nextDebitDate: newNextDebitDate,
    },
  });

  logger.info(
    `[Scheduler] Vault plan ${plan.id} updated. Next debit date: ${newNextDebitDate.toISOString()}`,
  );
}

async function processFantasyPlan(plan: Plan) {
  logger.info(
    `[Scheduler] Processing Fantasy plan ${plan.id} (${plan.name}), team ${plan.teamName}`,
  );

  let debitSuccess = false;
  let finalDebitAmount = plan.amount;
  let shouldDebit = false;

  if (plan.nextFixtureId && plan.teamId) {
    try {
      const result = await didTeamWin(plan.nextFixtureId, plan.teamId);
      logger.info(
        `[Scheduler] Fixture ${plan.nextFixtureId} check for team ${plan.teamName} returned: ${result}`,
      );

      if (result === 'WIN') {
        shouldDebit = true;
        finalDebitAmount = plan.amount;
      } else if (result === 'LOSS') {
        shouldDebit = true;
        finalDebitAmount = plan.amount / 2;
      } else {
        logger.info(`[Scheduler] Match result drew or cancelled. Skipping direct debit.`);
      }

      if (shouldDebit) {
        if (plan.autoSaveEnabled && plan.mandateId) {
          // ── Idempotency check: skip if already debited for this fixture ──────
          const alreadyDebited = plan.nextFixtureId
            ? await prisma.transaction.findFirst({
                where: {
                  planId: plan.id,
                  type: 'auto-save',
                  status: 'completed',
                  createdAt: { gte: plan.nextDebitDate || new Date(0) },
                },
              })
            : null;

          if (alreadyDebited) {
            logger.info(
              `[Scheduler] Fantasy plan ${plan.id} already debited for fixture ${plan.nextFixtureId} (tx: ${alreadyDebited.id}). Skipping.`,
            );
          } else {
            // ─────────────────────────────────────────────────────────────────
            try {
              const debitResponse = await debitMandate(plan.mandateId, finalDebitAmount);
              if (
                debitResponse.code === '00' ||
                debitResponse.code === '200' ||
                debitResponse.data?.status === 'SUCCESS'
              ) {
                debitSuccess = true;
                await prisma.transaction.create({
                  data: {
                    planId: plan.id,
                    userId: plan.userId,
                    amount: finalDebitAmount,
                    type: 'auto-save',
                    status: 'completed',
                  },
                });
              } else {
                logger.warn(
                  `[Scheduler] Fantasy debit failed: ${debitResponse.description || 'Unknown error'}`,
                );
                await prisma.transaction.create({
                  data: {
                    planId: plan.id,
                    userId: plan.userId,
                    amount: finalDebitAmount,
                    type: 'auto-save',
                    status: 'failed',
                  },
                });
              }
            } catch (err: unknown) {
              const error = err as Error;
              logger.error(`[Scheduler] Direct Debit payment failed with error:`, error);
              await prisma.transaction.create({
                data: {
                  planId: plan.id,
                  userId: plan.userId,
                  amount: finalDebitAmount,
                  type: 'auto-save',
                  status: 'failed',
                },
              });
            }
          }
        } else {
          logger.info(
            `[Scheduler] Fantasy plan autoSaveEnabled is false or mandateId is missing. Skipping auto debit.`,
          );
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(
        `[Scheduler] Error checking match winner for fixture ${plan.nextFixtureId}:`,
        error,
      );
    }
  } else {
    logger.warn(`[Scheduler] Fantasy plan has no nextFixtureId. Skipping match checking.`);
  }

  let newFixture = null;
  if (plan.teamId) {
    newFixture = await getNextFixture(plan.teamId).catch((err) => {
      logger.error('[Scheduler] Error fetching next fixture for fantasy plan update:', err);
      return null;
    });
  }

  let newNextFixtureId: number | null = null;
  let newNextFixtureDate: Date | null = null;
  let newNextDebitDate: Date;

  if (newFixture) {
    newNextFixtureId = newFixture.fixtureId;
    newNextFixtureDate = new Date(newFixture.date);
    newNextDebitDate = new Date(newNextFixtureDate.getTime() + 100 * 60 * 1000);
  } else {
    logger.info(
      `[Scheduler] No next fixture available for team ${plan.teamName}. Plan's next fixture remains pending notification.`,
    );
    newNextDebitDate = calculateNextDebitDate(plan.nextDebitDate || new Date(), 'weekly');
  }

  await prisma.plan.update({
    where: { id: plan.id },
    data: {
      currentBalance: debitSuccess ? { increment: finalDebitAmount } : undefined,
      nextFixtureId: newNextFixtureId,
      nextFixtureDate: newNextFixtureDate,
      nextDebitDate: newNextDebitDate,
    },
  });

  logger.info(
    `[Scheduler] Fantasy plan ${plan.id} updated. Next match: ${newNextFixtureId || 'None'}, next debit date: ${newNextDebitDate.toISOString()}`,
  );
}

export async function runPendingDebits() {
  const now = new Date();
  logger.info(`[Scheduler] Checking for due debits at ${now.toISOString()}`);

  try {
    const duePlans = await prisma.plan.findMany({
      where: {
        nextDebitDate: {
          lte: now,
        },
      },
    });

    if (duePlans.length === 0) {
      logger.info(`[Scheduler] No due plans found.`);
      return;
    }

    logger.info(`[Scheduler] Found ${duePlans.length} due savings plans.`);

    for (const plan of duePlans) {
      try {
        if (plan.savingPlan === 'vault') {
          await processVaultPlan(plan);
        } else if (plan.savingPlan === 'fantasy-savings') {
          await processFantasyPlan(plan);
        }
      } catch (err: unknown) {
        const error = err as Error;
        logger.error(`[Scheduler] Error processing plan ${plan.id} (${plan.name}):`, error);
      }
    }
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('[Scheduler] Error running pending debits:', err);
  }
}

export function start() {
  const intervalMs = 15 * 60 * 1000;
  logger.info(`[Scheduler] Starting background direct debit runner at 15-minute intervals`);

  runPendingDebits().catch((err) => {
    logger.error('[Scheduler] Initial run failed:', err);
  });

  setInterval(() => {
    runPendingDebits().catch((err) => {
      logger.error('[Scheduler] Background interval run failed:', err);
    });
  }, intervalMs);
}
