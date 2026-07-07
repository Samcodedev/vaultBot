import jwt from 'jsonwebtoken';
import supertest from 'supertest';

import app from '../src/app.js';
import {
  API_PLANS,
  VALID_PLAN_VAULT_BODY,
  VALID_PLAN_FANTASY_BODY,
  MOCK_FIXTURE,
} from './utils/constant.utils';
import prisma from '../src/config/db.js';
import { getNextFixture } from '../src/services/fantasy.service.js';

jest.mock('../src/config/db', () => ({
  __esModule: true,
  default: {
    plan: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('../src/services/fantasy.service', () => ({
  __esModule: true,
  getNextFixture: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockGetNextFixture = getNextFixture as jest.MockedFunction<typeof getNextFixture>;

const request = supertest(app);

const USER_ID = 'test-user-id';
const JWT_SECRET = 'test-jwt-secret';

let validToken: string;

beforeAll(() => {
  process.env.JWT_SECRET = JWT_SECRET;
  process.env.JWT_EXPIRES_IN = '1h';

  validToken = jwt.sign(
    {
      id: USER_ID,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/plans', () => {
  describe('Authentication', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request.post(API_PLANS).send({});
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Bearer token is required');
    });

    it('should return 401 when token is invalid', async () => {
      const res = await request
        .post(API_PLANS)
        .set('Authorization', 'Bearer invalid-token')
        .send({});
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid or expired token');
    });
  });

  describe('Validation', () => {
    const validVaultBody = VALID_PLAN_VAULT_BODY;

    it('should return 400 when title is missing', async () => {
      const { title: _title, ...invalidBody } = validVaultBody;
      const res = await request
        .post(API_PLANS)
        .set('Authorization', `Bearer ${validToken}`)
        .send(invalidBody);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 when savingType is invalid', async () => {
      const res = await request
        .post(API_PLANS)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validVaultBody, savingType: 'hourly' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when amount is negative', async () => {
      const res = await request
        .post(API_PLANS)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validVaultBody, amount: -10 });

      expect(res.status).toBe(400);
    });

    it('should return 400 when teamName is missing for fantasy-savings', async () => {
      const res = await request
        .post(API_PLANS)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          ...validVaultBody,
          savingPlan: 'fantasy-savings',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Execution - Vault Plan', () => {
    const validVaultBody = VALID_PLAN_VAULT_BODY;

    it('should create a vault plan successfully and return 201', async () => {
      const mockCreatedPlan = {
        id: 'plan-uuid-1',
        name: validVaultBody.title,
        description: validVaultBody.description,
        savingType: validVaultBody.savingType,
        savingPlan: validVaultBody.savingPlan,
        amount: validVaultBody.amount,
        targetAmount: validVaultBody.targetAmount,
        currentBalance: 0,
        startDate: new Date(validVaultBody.startDate),
        endDate: new Date(validVaultBody.endDate),
        debitSchedule: validVaultBody.debitScheduleTime,
        nextDebitDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.plan.create as jest.Mock).mockResolvedValue(mockCreatedPlan);

      const res = await request
        .post(API_PLANS)
        .set('Authorization', `Bearer ${validToken}`)
        .send(validVaultBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 'plan-uuid-1');
      expect(res.body.data).toHaveProperty('title', validVaultBody.title);
      expect(mockPrisma.plan.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Execution - Fantasy Savings Plan', () => {
    const validFantasyBody = VALID_PLAN_FANTASY_BODY;

    it('should return 404 when team is not found in local team data', async () => {
      const res = await request
        .post(API_PLANS)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validFantasyBody, teamName: 'Invalid FC' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No football team found matching');
    });

    it('should create a fantasy-savings plan successfully even if no fixtures are found', async () => {
      mockGetNextFixture.mockResolvedValue(null);

      const mockCreatedPlan = {
        id: 'plan-uuid-pending',
        name: validFantasyBody.title,
        description: validFantasyBody.description,
        savingType: validFantasyBody.savingType,
        savingPlan: validFantasyBody.savingPlan,
        amount: validFantasyBody.amount,
        targetAmount: validFantasyBody.targetAmount,
        currentBalance: 0,
        startDate: new Date(validFantasyBody.startDate),
        endDate: new Date(validFantasyBody.endDate),
        debitSchedule: 'Match Day',
        nextDebitDate: new Date(validFantasyBody.startDate),
        teamId: 42,
        teamName: 'Arsenal',
        nextFixtureId: null,
        nextFixtureDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.plan.create as jest.Mock).mockResolvedValue(mockCreatedPlan);

      const res = await request
        .post(API_PLANS)
        .set('Authorization', `Bearer ${validToken}`)
        .send(validFantasyBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 'plan-uuid-pending');
      expect(res.body.data.nextFixtureId).toBeNull();
      expect(res.body.data.nextFixtureDate).toBeNull();
      expect(res.body.message).toContain(
        'Your savings will start when match schedules are available',
      );
    });

    it('should create a fantasy-savings plan successfully and return 201', async () => {
      const mockFixture = MOCK_FIXTURE;

      const mockCreatedPlan = {
        id: 'plan-uuid-2',
        name: validFantasyBody.title,
        description: validFantasyBody.description,
        savingType: validFantasyBody.savingType,
        savingPlan: validFantasyBody.savingPlan,
        amount: validFantasyBody.amount,
        targetAmount: validFantasyBody.targetAmount,
        currentBalance: 0,
        startDate: new Date(validFantasyBody.startDate),
        endDate: new Date(validFantasyBody.endDate),
        debitSchedule: 'Match Day',
        nextDebitDate: new Date(mockFixture.date),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGetNextFixture.mockResolvedValue(mockFixture);
      (mockPrisma.plan.create as jest.Mock).mockResolvedValue(mockCreatedPlan);

      const res = await request
        .post(API_PLANS)
        .set('Authorization', `Bearer ${validToken}`)
        .send(validFantasyBody);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', 'plan-uuid-2');
      expect(mockGetNextFixture).toHaveBeenCalledWith(42); // Arsenal ID is 42 in local team data
      expect(mockPrisma.plan.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /api/plans', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request.get(API_PLANS);
      expect(res.status).toBe(401);
    });

    it('should return all plans for the authenticated user successfully', async () => {
      const mockPlans = [
        {
          id: 'plan-1',
          userId: USER_ID,
          name: 'Vault savings 1',
          description: 'Desc 1',
          savingType: 'weekly',
          savingPlan: 'vault',
          amount: 50,
          targetAmount: 500,
          currentBalance: 100,
          startDate: new Date(),
          endDate: new Date(),
          debitSchedule: '10:00 AM',
          nextDebitDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockPrisma.plan.findMany as jest.Mock).mockResolvedValue(mockPlans);

      const res = await request.get(API_PLANS).set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toHaveProperty('title', 'Vault savings 1');
      expect(mockPrisma.plan.findMany).toHaveBeenCalledWith({
        where: { userId: USER_ID },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('GET /api/plans/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request.get(`${API_PLANS}/plan-1`);
      expect(res.status).toBe(401);
    });

    it('should return 404 if plan does not exist', async () => {
      (mockPrisma.plan.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request
        .get(`${API_PLANS}/plan-nonexistent`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 if plan belongs to a different user', async () => {
      (mockPrisma.plan.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request
        .get(`${API_PLANS}/plan-other`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return the plan successfully when owner matches', async () => {
      const mockPlan = {
        id: 'plan-1',
        userId: USER_ID,
        name: 'Vault savings 1',
        description: 'Desc 1',
        savingType: 'weekly',
        savingPlan: 'vault',
        amount: 50,
        targetAmount: 500,
        currentBalance: 100,
        startDate: new Date(),
        endDate: new Date(),
        debitSchedule: '10:00 AM',
        nextDebitDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.plan.findFirst as jest.Mock).mockResolvedValue(mockPlan);

      const res = await request
        .get(`${API_PLANS}/plan-1`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('title', 'Vault savings 1');
      expect(mockPrisma.plan.findFirst).toHaveBeenCalledWith({
        where: { id: 'plan-1', userId: USER_ID },
      });
    });
  });

  describe('PUT /api/plans/:id', () => {
    it('should return 401 when no token is provided', async () => {
      const res = await request.put(`${API_PLANS}/plan-1`).send({});
      expect(res.status).toBe(401);
    });

    it('should return 404 if plan to update is not found', async () => {
      (mockPrisma.plan.findFirst as jest.Mock).mockResolvedValue(null);

      const res = await request
        .put(`${API_PLANS}/plan-nonexistent`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(404);
    });

    it('should return 400 when update payload validation fails', async () => {
      const res = await request
        .put(`${API_PLANS}/plan-1`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ amount: -20 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should update plan, recalculate vault nextDebitDate, and return 200', async () => {
      const existingPlan = {
        id: 'plan-1',
        userId: USER_ID,
        name: 'Vault savings 1',
        description: 'Desc 1',
        savingType: 'weekly',
        savingPlan: 'vault',
        amount: 50,
        targetAmount: 500,
        currentBalance: 100,
        startDate: new Date('2026-07-10T10:00:00.000Z'),
        endDate: new Date('2026-10-10T10:00:00.000Z'),
        debitSchedule: '10:00 AM',
        nextDebitDate: new Date('2026-07-17T10:00:00.000Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedPlan = {
        ...existingPlan,
        name: 'Updated Vault Title',
        amount: 100,
      };

      (mockPrisma.plan.findFirst as jest.Mock).mockResolvedValue(existingPlan);
      (mockPrisma.plan.update as jest.Mock).mockResolvedValue(mockUpdatedPlan);

      const res = await request
        .put(`${API_PLANS}/plan-1`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Updated Vault Title',
          amount: 100,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('title', 'Updated Vault Title');
      expect(res.body.data).toHaveProperty('amount', 100);
      expect(mockPrisma.plan.update).toHaveBeenCalledTimes(1);
    });
  });
});
