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

      const nextFixture = await getNextFixture(teamId);

      if (!nextFixture) {
        return res.status(BAD_REQUEST.STATUS_CODE).json({
          success: false,
          message: `No upcoming fixtures found for ${resolvedTeamName}. Try again when their schedule is available.`,
        });
      }

      const nextDebitDate = new Date(nextFixture.date);

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
          nextFixtureId: nextFixture.fixtureId,
          nextFixtureDate: nextDebitDate,
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

      return res.status(201).json({
        success: true,
        message: `Fantasy-savings plan created! Next debit on match day: ${resolvedTeamName} vs ${nextFixture.home === resolvedTeamName ? nextFixture.away : nextFixture.home} (${nextFixture.league})`,
        data: {
          ...newPlan,
          title: newPlan.name,
          nextFixture,
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
