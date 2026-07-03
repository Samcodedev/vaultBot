import supertest from 'supertest';

import { INVALID_USER_DETAILS, VALID_USER_DETAILS, API } from './utils/constant.utils';
import app from '../src/app';
import prisma from '../src/config/db';

jest.mock('../src/config/db', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
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

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

const request = supertest(app);

const VALID_USER = {
  id: 'test-uuid-1234',
  name: VALID_USER_DETAILS.name,
  email: VALID_USER_DETAILS.email,
  password: VALID_USER_DETAILS.bcryptPassword,
  phoneNumber: null,
  accountNumber: '',
  accountId: '',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const REGISTER_BODY = {
  name: VALID_USER_DETAILS.name,
  email: VALID_USER_DETAILS.email,
  password: VALID_USER_DETAILS.password,
};

const LOGIN_BODY = {
  email: VALID_USER_DETAILS.email,
  password: VALID_USER_DETAILS.password,
};

beforeAll(() => {
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.JWT_EXPIRES_IN = '1h';
});

describe(`POST ${API}/register`, () => {
  it('should return 201 and the created user on valid registration', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    const { password: _pw, ...userWithoutPassword } = VALID_USER;
    (mockPrisma.user.create as jest.Mock).mockResolvedValue(userWithoutPassword);

    const res = await request.post(`${API}/register`).send(REGISTER_BODY);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('email', VALID_USER.email);
    expect(res.body).not.toHaveProperty('password');
  });

  it('should return 409 when email is already registered', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(VALID_USER);

    const res = await request.post(`${API}/register`).send(REGISTER_BODY);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('message', 'Email already registered');
  });

  it('should return 400 when request body is invalid (missing name)', async () => {
    const res = await request.post(`${API}/register`).send({
      email: VALID_USER_DETAILS.email,
      password: VALID_USER_DETAILS.password,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.errors).toBeDefined();
  });

  it('should return 400 when email is invalid', async () => {
    const res = await request.post(`${API}/register`).send({
      ...REGISTER_BODY,
      email: INVALID_USER_DETAILS.email,
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should return 400 when password is too weak', async () => {
    const res = await request.post(`${API}/register`).send({
      ...REGISTER_BODY,
      password: 'weak',
    });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });
});

describe(`POST ${API}/login`, () => {
  it('should return 200 and a token on valid credentials', async () => {
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('Password1!', 10);
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...VALID_USER,
      password: hashedPassword,
    });

    const res = await request.post(`${API}/login`).send(LOGIN_BODY);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  it('should return 404 when user does not exist', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request.post(`${API}/login`).send(LOGIN_BODY);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'User not found');
  });

  it('should return 401 when password is incorrect', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(VALID_USER);

    const res = await request.post(`${API}/login`).send({
      ...LOGIN_BODY,
      password: 'WrongPassword1!',
    });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid email or password');
  });

  it('should return 400 when email is missing', async () => {
    const res = await request.post(`${API}/login`).send({ password: VALID_USER_DETAILS.password });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });
});

describe(`GET ${API}/`, () => {
  let validToken: string;

  beforeAll(async () => {
    const jwt = await import('jsonwebtoken');
    validToken = jwt.sign(
      { id: VALID_USER.id, name: VALID_USER.name, email: VALID_USER.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' },
    );
  });

  it('should return 200 and the user profile when authenticated', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(VALID_USER);

    const res = await request.get(`${API}/`).set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('email', VALID_USER.email);
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('should return 401 when no Authorization header is provided', async () => {
    const res = await request.get(`${API}/`);

    expect(res.status).toBe(401);
  });

  it('should return 401 when token is invalid', async () => {
    const res = await request.get(`${API}/`).set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
  });

  it('should return 404 when authenticated user is not found in DB', async () => {
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const res = await request.get(`${API}/`).set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'User not found');
  });
});
