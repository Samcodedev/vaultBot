export const VALID_USER_DETAILS = {
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  password: 'Password1!',
  bcryptPassword: '$2b$10$hashedPasswordPlaceholder',
  phoneNumber: '08064434940',
};

export const INVALID_USER_DETAILS = {
  email: 'not-an-email',
  password: 'Password',
  phoneNumber: '1234567890',
};

export const API = '/api/auth';
export const API_PLANS = '/api/plans';

export const VALID_PLAN_VAULT_BODY = {
  name: 'Vault Savings',
  description: 'Emergency Fund',
  savingType: 'weekly',
  savingPlan: 'vault',
  amount: 50,
  targetAmount: 500,
  startDate: '2026-07-10T10:00:00.000Z',
  endDate: '2026-10-10T10:00:00.000Z',
  debitSchedule: '08:00 AM',
};

export const VALID_PLAN_FANTASY_BODY = {
  name: 'Arsenal Savings',
  description: 'Save when Arsenal play',
  savingType: 'weekly',
  savingPlan: 'fantasy-savings',
  amount: 20,
  targetAmount: 200,
  startDate: '2026-07-10T10:00:00.000Z',
  endDate: '2026-10-10T10:00:00.000Z',
  debitSchedule: '08:00 AM',
  teamName: 'Arsenal',
};

export const MOCK_FIXTURE = {
  fixtureId: 12345,
  date: '2026-07-15T15:00:00.000Z',
  league: 'Premier League',
  home: 'Arsenal',
  away: 'Chelsea',
  status: 'NS',
};
