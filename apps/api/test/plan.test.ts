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

    it('should return 400 when no upcoming fixtures are found', async () => {
      mockGetNextFixture.mockResolvedValue(null);

      const res = await request
        .post(API_PLANS)
        .set('Authorization', `Bearer ${validToken}`)
        .send(validFantasyBody);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No upcoming fixtures found for');
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
});
