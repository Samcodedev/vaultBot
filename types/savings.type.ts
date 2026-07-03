export interface SavingsPlan {
  id: string;
  title: string;
  description?: string;
  currentBalance: number;
  targetAmount: number;
  savingType: 'daily' | 'weekly' | 'monthly' | 'yearly' | string;
  savingDuration: string;
}

export interface SavingsTransaction {
  id: string;
  planTitle: string;
  amount: number;
  type: 'deposit' | 'auto-save';
  status: 'completed' | 'processing';
  date: string;
}
