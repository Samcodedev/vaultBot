export interface SavingsPlan {
  id: string;
  title: string;
  description?: string;
  currentBalance: number;
  targetAmount: number;
  savingType: 'daily' | 'weekly' | 'monthly' | 'yearly' | string;
  savingDuration: string;
  savingPlan?: 'vault' | 'fantasy-savings';
  teamName?: string;
  teamLogo?: string;
  amount?: number;
  debitScheduleTime?: string;
  nextDebitDate?: string | Date;
}

export interface SavingsTransaction {
  id: string;
  planTitle: string;
  amount: number;
  type: 'deposit' | 'auto-save';
  status: 'completed' | 'processing';
  date: string;
}
