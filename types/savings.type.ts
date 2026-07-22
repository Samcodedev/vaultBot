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
  debitSchedule?: string;
  nextDebitDate?: string | Date;
  teamId?: number;
  nextFixtureId?: number | null;
  nextFixtureDate?: string | Date | null;
  mandateId?: string;
  merchantReference?: string;
  mandateStatus?: string;
  mandateAdviceStatus?: string;
  autoSaveEnabled?: boolean;
}

export interface SavingsTransaction {
  id: string;
  planTitle: string;
  amount: number;
  type: 'deposit' | 'auto-save';
  status: 'completed' | 'processing';
  date: string;
}

export interface VirtualAccountResponse {
  bankAccountNumber: string;
  bankName: string;
  bankAccountName: string;
  accountHolderId: string;
}

export interface DirectDebitMandateResponse {
  mandateId: string;
  merchantReference: string;
  status: string;
}

export interface MandateStatusResponse {
  mandateId: string;
  status?: string;
  mandateStatus?: string;
  mandateAdviceStatus?: string;
  autoSaveEnabled?: boolean;
  isActive?: boolean;
}

export interface MandateDetailsResponse {
  id: string;
  mandateId: string;
  merchantReference: string;
  mandateStatus: string;
  mandateAdviceStatus: string;
  amount: number;
}

export interface DebitMandateResponse {
  status?: string;
  description?: string;
  code?: string;
  data?: {
    status: string;
    transactionId?: string;
  };
  transactionId?: string;
  amount?: number;
  planTitle?: string;
}

export interface PaginationMetadata {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface PaginatedTransactions {
  transactions: SavingsTransaction[];
  pagination?: PaginationMetadata;
}
