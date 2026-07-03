import type { SavingsPlan, SavingsTransaction } from '@/types';

export const DEFAULT_PLANS: SavingsPlan[] = [
  {
    id: '1',
    title: 'Vacation Fund',
    description: 'Trip to Paris',
    currentBalance: 45000,
    targetAmount: 100000,
    savingType: 'monthly',
    savingDuration: '2025-12-31',
  },
  {
    id: '2',
    title: 'Emergency Fund',
    description: 'Safety net for unexpected expenses',
    currentBalance: 80000,
    targetAmount: 200000,
    savingType: 'weekly',
    savingDuration: '2026-06-30',
  },
  {
    id: '3',
    title: 'New Laptop',
    description: 'Developer work setup upgrade',
    currentBalance: 120000,
    targetAmount: 150000,
    savingType: 'daily',
    savingDuration: '2025-08-15',
  },
];

export const DEFAULT_TRANSACTIONS: SavingsTransaction[] = [
  {
    id: 'tx-1',
    planTitle: 'Vacation Fund',
    amount: 15000,
    type: 'auto-save',
    status: 'completed',
    date: '2 hours ago',
  },
  {
    id: 'tx-2',
    planTitle: 'Emergency Fund',
    amount: 10000,
    type: 'deposit',
    status: 'completed',
    date: '1 day ago',
  },
  {
    id: 'tx-3',
    planTitle: 'New Laptop',
    amount: 5000,
    type: 'auto-save',
    status: 'completed',
    date: '2 days ago',
  },
  {
    id: 'tx-4',
    planTitle: 'Emergency Fund',
    amount: 20000,
    type: 'deposit',
    status: 'completed',
    date: '5 days ago',
  },
];

export const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Auto-Save Success',
    desc: '₦10,000 automatically added to Emergency Fund.',
    time: '2 hours ago',
    unread: true,
  },
  {
    id: 2,
    title: 'Goal Milestone reached!',
    desc: 'Vacation Fund is now 45% completed. Keep going!',
    time: '1 day ago',
    unread: true,
  },
  {
    id: 3,
    title: 'Monthly summary ready',
    desc: 'Your June savings report is ready to review.',
    time: '3 days ago',
    unread: false,
  },
];
