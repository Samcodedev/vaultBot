import type { SavingsPlan, SavingsTransaction } from '@/types';

export const DEFAULT_PLANS: SavingsPlan[] = [];

export const DEFAULT_TRANSACTIONS: SavingsTransaction[] = [];

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
