import type {
  LoginUserInput,
  RegisterUserInput,
  AuthResponse,
  User,
  SavingsPlan,
  SavingsTransaction,
  VirtualAccountResponse,
  DirectDebitMandateResponse,
  MandateStatusResponse,
  MandateDetailsResponse,
  DebitMandateResponse,
  PaginatedTransactions,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const authApi = {
  login: async (credentials: LoginUserInput): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to log in');
    }

    return data;
  },

  register: async (credentials: RegisterUserInput): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  },

  getUser: async (token: string): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/auth`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch user data');
    }

    return data.data;
  },
};

export const planApi = {
  createPlan: async (planData: Partial<SavingsPlan>, token: string): Promise<SavingsPlan> => {
    const res = await fetch(`${API_BASE_URL}/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(planData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to create savings plan');
    }

    return data.data;
  },

  getPlans: async (token: string): Promise<SavingsPlan[]> => {
    const res = await fetch(`${API_BASE_URL}/plans`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch savings plans');
    }

    return data.data;
  },

  getPlanById: async (id: string, token: string): Promise<SavingsPlan> => {
    const res = await fetch(`${API_BASE_URL}/plans/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch plan details');
    }

    return data.data;
  },

  updatePlan: async (
    id: string,
    planData: Partial<SavingsPlan>,
    token: string,
  ): Promise<SavingsPlan> => {
    const res = await fetch(`${API_BASE_URL}/plans/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(planData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to update savings plan');
    }

    return data.data;
  },

  deletePlan: async (id: string, token: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/plans/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to delete savings plan');
    }

    return data;
  },
};

export const nombaApi = {
  createVirtualAccount: async (
    fullName: string,
    token: string,
  ): Promise<VirtualAccountResponse> => {
    const res = await fetch(`${API_BASE_URL}/nomba/virtual-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fullName }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to set up virtual account');
    }

    return data.data;
  },

  createDirectDebitMandate: async (
    mandateData: {
      planId: string;
      customerAccountNumber: string;
      bankCode: string;
      customerAddress: string;
      customerAccountName: string;
    },
    token: string,
  ): Promise<DirectDebitMandateResponse> => {
    const res = await fetch(`${API_BASE_URL}/nomba/direct-debit/mandate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(mandateData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to initiate direct debit mandate');
    }

    return data.data;
  },

  checkMandateStatus: async (planId: string, token: string): Promise<MandateStatusResponse> => {
    const res = await fetch(`${API_BASE_URL}/nomba/direct-debit/mandate/status/${planId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to check mandate status');
    }

    return data.data;
  },

  getMandateDetails: async (planId: string, token: string): Promise<MandateDetailsResponse> => {
    const res = await fetch(`${API_BASE_URL}/nomba/direct-debit/mandate/${planId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch mandate details');
    }

    return data.data;
  },

  debitMandate: async (planId: string, token: string): Promise<DebitMandateResponse> => {
    const res = await fetch(`${API_BASE_URL}/nomba/direct-debit/debit-mandate/${planId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to debit mandate');
    }

    return data.data;
  },

  syncTransactions: async (
    token: string,
  ): Promise<{
    credited: number;
    details: { amount: number; plan: string; ref: string }[];
    message: string;
  }> => {
    const res = await fetch(`${API_BASE_URL}/nomba/sync-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to sync transactions');
    }

    return data;
  },
};

export const transactionApi = {
  getTransactions: async (
    token: string,
    params?: { page?: number; limit?: number; all?: boolean; type?: string; search?: string },
  ): Promise<PaginatedTransactions> => {
    const query = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) query.append('page', params.page.toString());
      if (params.limit !== undefined) query.append('limit', params.limit.toString());
      if (params.all !== undefined) query.append('all', params.all.toString());
      if (params.type !== undefined) query.append('type', params.type);
      if (params.search !== undefined) query.append('search', params.search);
    }
    const queryString = query.toString();
    const url = `${API_BASE_URL}/transactions${queryString ? `?${queryString}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch transactions');
    }

    return data.data;
  },

  createTransaction: async (
    txData: { planId: string; amount: number; type: 'deposit' | 'auto-save' },
    token: string,
  ): Promise<SavingsTransaction> => {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(txData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to create transaction');
    }

    return data.data;
  },

  getPlanTransactions: async (
    planId: string,
    token: string,
    params?: { page?: number; limit?: number; all?: boolean; type?: string; search?: string },
  ): Promise<PaginatedTransactions> => {
    const query = new URLSearchParams();
    if (params) {
      if (params.page !== undefined) query.append('page', params.page.toString());
      if (params.limit !== undefined) query.append('limit', params.limit.toString());
      if (params.all !== undefined) query.append('all', params.all.toString());
      if (params.type !== undefined) query.append('type', params.type);
      if (params.search !== undefined) query.append('search', params.search);
    }
    const queryString = query.toString();
    const url = `${API_BASE_URL}/transactions/plan/${planId}${queryString ? `?${queryString}` : ''}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch plan transactions');
    }

    return data.data;
  },
};

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  type: string;
  amount: number;
  planName: string;
  createdAt: string;
}

export const notificationsApi = {
  getNotifications: async (token: string): Promise<AppNotification[]> => {
    const res = await fetch(`${API_BASE_URL}/notifications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch notifications');
    }

    return data.data;
  },
};
