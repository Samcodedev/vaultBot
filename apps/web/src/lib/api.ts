import type { LoginUserInput, RegisterUserInput, AuthResponse, User } from '@/types';

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
