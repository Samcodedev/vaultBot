import type { LoginUserInput, RegisterUserInput, AuthResponse, User, SavingsPlan } from '@/types';

const API_BASE_URL = 'http://localhost:5000/api';

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
};
