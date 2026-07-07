import jwt from 'jsonwebtoken';
import supertest from 'supertest';

import app from '../src/app.js';
import prisma from '../src/config/db.js';
import { createVirtualAccount } from '../src/services/index.js';

jest.mock('../src/config/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../src/services/index.js', () => ({
  __esModule: true,
  createVirtualAccount: jest.fn(),
  hashPassword: jest.fn(),
  comparePasswords: jest.fn(),
  generateToken: jest.fn(),
}));

jest.mock('../src/utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockCreateVirtualAccount = createVirtualAccount as jest.MockedFunction<
  typeof createVirtualAccount
>;

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

describe('POST /api/nomba/virtual-account', () => {
  it('should return 401 when no token is provided', async () => {
    const res = await request.post('/api/nomba/virtual-account').send({});
    expect(res.status).toBe(401);
  });

  it('should return 400 when body lacks required fullName', async () => {
    const res = await request
      .post('/api/nomba/virtual-account')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Validation Error');
  });

  it('should return 400 when user already has a virtual account', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: USER_ID,
      accountNumber: '9391076543',
      accountId: 'holder-id-123',
    } as any);

    const res = await request
      .post('/api/nomba/virtual-account')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ fullName: 'John Doe' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already been created');
  });

  it('should create virtual account successfully and update user', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: USER_ID,
      accountNumber: '',
      accountId: '',
    } as any);

    mockCreateVirtualAccount.mockResolvedValue({
      code: '00',
      description: 'Success',
      data: {
        bankAccountNumber: '1234567890',
        accountHolderId: 'holder-id-456',
        bankName: 'Nombank MFB',
        bankAccountName: 'Nomba/John Doe',
      },
    });

    (mockPrisma.user.update as jest.Mock).mockResolvedValue({
      id: USER_ID,
      accountNumber: '1234567890',
      accountId: 'holder-id-456',
    } as any);

    const res = await request
      .post('/api/nomba/virtual-account')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ fullName: 'John Doe' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bankAccountNumber).toBe('1234567890');
    expect(mockCreateVirtualAccount).toHaveBeenCalledWith({
      userId: USER_ID,
      fullName: 'John Doe',
    });
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
  });
});
