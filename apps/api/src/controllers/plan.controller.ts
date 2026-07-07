import type { Response } from 'express';

import { teams } from '../../../../data/team.data.js';
import prisma from '../config/db.js';
import { calculateNextDebitDate, calculateEndDate } from '../services/calculations.service.js';
import { getNextFixture } from '../services/fantasy.service.js';
import type { AuthenticatedRequest } from '../types/index.js';
import {
  INTERNAL_SERVER_ERROR,
  BAD_REQUEST,
  NOT_FOUND,
  UNAUTHORIZED,
  UNAUTHORIZED_ACCESS,
  logger,
  SAVING_TYPE,
} from '../utils/index.js';

export const createPlan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      savingType,
      savingPlan,
      amount,
      targetAmount,
      debitScheduleTime,
      teamName,
    } = req.body;

    if (!req.user) {
      return res.status(UNAUTHORIZED.STATUS_CODE).json({
        success: false,
        error: UNAUTHORIZED.ERROR,
      });
    }

    const { id: userId } = req.user;

    const startDate = new Date();
    const amountVal = parseFloat(amount.toString());
    const targetAmountVal = parseFloat(targetAmount.toString());

    if (savingPlan === 'vault') {
      const debitSchedule = debitScheduleTime;
      const nextDebitDate = calculateNextDebitDate(
        savingType as (typeof SAVING_TYPE)[number],
        debitSchedule,
        startDate,
      );

      if (isNaN(nextDebitDate.getTime())) {
        return res.status(BAD_REQUEST.STATUS_CODE).json({
          success: false,
          message: 'Invalid debit schedule time format. Please use "HH:MM AM/PM" format.',
        });
      }

      const endDate = calculateEndDate(savingType, targetAmountVal, amountVal, startDate);

      const newPlan = await prisma.plan.create({
        data: {
          userId,
          name: title,
          description,
          savingType,
          savingPlan,
          amount: amountVal,
          targetAmount: targetAmountVal,
          startDate,
          endDate,
          debitSchedule,
          nextDebitDate,
        },
        select: {
          id: true,
          name: true,
          description: true,
          savingType: true,
          savingPlan: true,
          amount: true,
          targetAmount: true,
          currentBalance: true,
          startDate: true,
          endDate: true,
          debitSchedule: true,
          nextDebitDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Vault plan created successfully',
        data: {
          ...newPlan,
          title: newPlan.name,
          debitScheduleTime: newPlan.debitSchedule,
        },
      });
    }

    if (savingPlan === 'fantasy-savings') {
      const matchedTeam = teams.find((t) => t.name.toLowerCase().includes(teamName.toLowerCase()));

      if (!matchedTeam) {
        return res.status(NOT_FOUND.STATUS_CODE).json({
          success: false,
          message: `No football team found matching "${teamName}". Please try a different name.`,
        });
      }

      const teamId: number = matchedTeam.id;
      const resolvedTeamName: string = matchedTeam.name;

      const nextFixture = await getNextFixture(teamId).catch((err) => {
        logger.error('Error fetching next fixture from football API:', err);
        return null;
      });

      let nextDebitDate: Date;
      let nextFixtureId: number | null = null;
      let nextFixtureDate: Date | null = null;

      if (nextFixture) {
        nextFixtureDate = new Date(nextFixture.date);
        nextDebitDate = new Date(nextFixtureDate.getTime() + 100 * 60 * 1000);
        nextFixtureId = nextFixture.fixtureId;
      } else {
        nextDebitDate = startDate;
      }

      const endDate = calculateEndDate(savingType, targetAmountVal, amountVal, startDate);
      const debitSchedule = 'Match Day';

      const newPlan = await prisma.plan.create({
        data: {
          userId,
          name: title,
          description,
          savingType,
          savingPlan,
          amount: amountVal,
          targetAmount: targetAmountVal,
          startDate,
          endDate,
          debitSchedule,
          nextDebitDate,
          teamId,
          teamName: resolvedTeamName,
          nextFixtureId,
          nextFixtureDate,
        },
        select: {
          id: true,
          name: true,
          description: true,
          savingType: true,
          savingPlan: true,
          amount: true,
          targetAmount: true,
          currentBalance: true,
          startDate: true,
          endDate: true,
          debitSchedule: true,
          nextDebitDate: true,
          teamId: true,
          teamName: true,
          nextFixtureId: true,
          nextFixtureDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const message = nextFixture
        ? `Fantasy-savings plan created! Next debit on match day: ${resolvedTeamName} vs ${nextFixture.home === resolvedTeamName ? nextFixture.away : nextFixture.home} (${nextFixture.league})`
        : `Fantasy-savings plan created successfully! Note: Premier League is currently on break. Your savings will start when match schedules are available.`;

      return res.status(201).json({
        success: true,
        message,
        data: {
          ...newPlan,
          title: newPlan.name,
          debitScheduleTime: newPlan.debitSchedule,
          nextFixture: nextFixture || null,
        },
      });
    }

    return res.status(BAD_REQUEST.STATUS_CODE).json({
      success: false,
      message: 'Invalid saving plan type.',
    });
  } catch (error) {
    logger.error('Error in createPlan:', error);
    return res
      .status(INTERNAL_SERVER_ERROR.STATUS_CODE)
      .json({ success: false, error: INTERNAL_SERVER_ERROR.ERROR });
  }
};

export const getPlans = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(UNAUTHORIZED.STATUS_CODE).json({
        success: false,
        message: UNAUTHORIZED_ACCESS,
      });
    }

    const plans = await prisma.plan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const mappedPlans = plans.map((plan) => ({
      ...plan,
      title: plan.name,
      debitScheduleTime: plan.debitSchedule,
    }));

    return res.status(200).json({
      success: true,
      data: mappedPlans,
    });
  } catch (error) {
    logger.error('Error in getPlans:', error);
    return res
      .status(INTERNAL_SERVER_ERROR.STATUS_CODE)
      .json({ success: false, error: INTERNAL_SERVER_ERROR.ERROR });
  }
};

export const getPlanById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;

    if (!userId) {
      return res.status(UNAUTHORIZED.STATUS_CODE).json({
        success: false,
        message: UNAUTHORIZED_ACCESS,
      });
    }

    const plan = await prisma.plan.findFirst({
      where: { id, userId },
    });

    if (!plan) {
      return res.status(NOT_FOUND.STATUS_CODE).json({
        success: false,
        message: 'Savings plan not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...plan,
        title: plan.name,
        debitScheduleTime: plan.debitSchedule,
      },
    });
  } catch (error) {
    logger.error('Error in getPlanById:', error);
    return res
      .status(INTERNAL_SERVER_ERROR.STATUS_CODE)
      .json({ success: false, error: INTERNAL_SERVER_ERROR.ERROR });
  }
};

export const updatePlan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id as string;
    const { title, description, amount, targetAmount, savingType, debitScheduleTime } = req.body;

    if (!userId) {
      return res.status(UNAUTHORIZED.STATUS_CODE).json({
        success: false,
        message: UNAUTHORIZED_ACCESS,
      });
    }

    const plan = await prisma.plan.findFirst({
      where: { id, userId },
    });

    if (!plan) {
      return res.status(NOT_FOUND.STATUS_CODE).json({
        success: false,
        message: 'Savings plan not found',
      });
    }

    // Merge updates
    const name = title !== undefined ? title : plan.name;
    const desc = description !== undefined ? description : plan.description;
    const amt = amount !== undefined ? parseFloat(amount.toString()) : plan.amount;
    const targetAmt =
      targetAmount !== undefined ? parseFloat(targetAmount.toString()) : plan.targetAmount;
    const type = savingType !== undefined ? savingType : plan.savingType;
    const schedule =
      plan.savingPlan === 'vault' && debitScheduleTime !== undefined
        ? debitScheduleTime
        : plan.debitSchedule;
    const currentBal =
      req.body.currentBalance !== undefined
        ? parseFloat(req.body.currentBalance.toString())
        : plan.currentBalance;

    // Recalculate if calculations-related fields are updated
    let nextDebitDate = plan.nextDebitDate;
    let endDate = plan.endDate;

    if (plan.savingPlan === 'vault') {
      const isCalculationUpdate =
        amount !== undefined ||
        targetAmount !== undefined ||
        savingType !== undefined ||
        debitScheduleTime !== undefined;

      if (isCalculationUpdate) {
        nextDebitDate = calculateNextDebitDate(
          type as (typeof SAVING_TYPE)[number],
          schedule,
          new Date(),
        );
        endDate = calculateEndDate(type, targetAmt, amt, plan.startDate);

        if (isNaN(nextDebitDate.getTime())) {
          return res.status(BAD_REQUEST.STATUS_CODE).json({
            success: false,
            message: 'Invalid debit schedule time format. Please use "HH:MM AM/PM" format.',
          });
        }
      }
    } else if (plan.savingPlan === 'fantasy-savings') {
      const isCalculationUpdate =
        amount !== undefined || targetAmount !== undefined || savingType !== undefined;

      if (isCalculationUpdate) {
        endDate = calculateEndDate(type, targetAmt, amt, plan.startDate);
      }
    }

    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: {
        name,
        description: desc,
        amount: amt,
        targetAmount: targetAmt,
        savingType: type,
        debitSchedule: schedule,
        nextDebitDate,
        endDate,
        currentBalance: currentBal,
      },
      select: {
        id: true,
        name: true,
        description: true,
        savingType: true,
        savingPlan: true,
        amount: true,
        targetAmount: true,
        currentBalance: true,
        startDate: true,
        endDate: true,
        debitSchedule: true,
        nextDebitDate: true,
        teamId: true,
        teamName: true,
        nextFixtureId: true,
        nextFixtureDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: {
        ...updatedPlan,
        title: updatedPlan.name,
        debitScheduleTime: updatedPlan.debitSchedule,
      },
    });
  } catch (error) {
    logger.error('Error in updatePlan:', error);
    return res
      .status(INTERNAL_SERVER_ERROR.STATUS_CODE)
      .json({ success: false, error: INTERNAL_SERVER_ERROR.ERROR });
  }
};
