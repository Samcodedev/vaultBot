import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import type { RegisterUserInput, AuthResponse } from '@/types';

export default function Register() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterUserInput) => authApi.register(payload),
    onSuccess: (data: AuthResponse) => {
      login(data.token, data.user);
      toast.success('Account created!');
      navigate('/');
    },
    onError: (err: unknown) => {
      const error = err as Error & { errors?: { msg: string }[] };
      const msg = error?.errors?.[0]?.msg || error.message || 'Registration failed';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    const payload: RegisterUserInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email,
      password: form.password,
      phoneNumber: form.phoneNumber || null,
    };

    registerMutation.mutate(payload);
  };

  const loading = registerMutation.isPending;

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-lg">
            <Shield size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">VaultBot</h2>
          <p className="mt-3 text-white/70">
            Join thousands already building their financial future with automated savings.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Shield size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">VaultBot</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Start your savings journey today</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  value={form.firstName}
                  onChange={update('firstName')}
                  placeholder="John"
                  required
                  disabled={loading}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-colors mt-1 text-gray-900 disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  value={form.lastName}
                  onChange={update('lastName')}
                  placeholder="Doe"
                  required
                  disabled={loading}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-colors mt-1 text-gray-900 disabled:opacity-50"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="john@example.com"
                required
                disabled={loading}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-colors mt-1 text-gray-900 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phoneNumber}
                onChange={update('phoneNumber')}
                placeholder="08123456789"
                required
                disabled={loading}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-colors mt-1 text-gray-900 disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={update('password')}
                placeholder="Min. 6 characters"
                required
                disabled={loading}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-colors mt-1 text-gray-900 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 gradient-primary text-white py-2 px-4 rounded-md font-semibold hover:opacity-95 transition-opacity disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-md"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Create Account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
