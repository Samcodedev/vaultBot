import { Shield, TrendingUp, Zap, PiggyBank } from 'lucide-react';
import type { Feature } from '../types/pages.type';

export const features: Feature[] = [
  {
    icon: PiggyBank,
    title: 'Automated Savings',
    desc: 'Set it and forget it. We auto-debit your card on schedule.',
  },
  {
    icon: TrendingUp,
    title: 'Track Progress',
    desc: 'Visual progress rings show how close you are to each goal.',
  },
  {
    icon: Zap,
    title: 'Flexible Plans',
    desc: 'Daily, weekly, monthly or yearly save at your own pace.',
  },
  {
    icon: Shield,
    title: 'Secure & Trusted',
    desc: 'Bank-grade encryption keeps your money and data safe.',
  },
];
