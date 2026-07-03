import { useState } from 'react';
import { DashboardLayout, SavingsCard } from '@/components';
import { PlusCircle } from 'lucide-react';
import type { SavingsPlan as Plan } from '@/types';

export default function PlansPage() {
  const [plans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem('vb_plans');
    return saved ? JSON.parse(saved) : [];
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Your Savings Plans</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              View your automated savings goals
            </p>
          </div>
          <button
            onClick={() => window.location.assign('/dashboard/create')}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-elevated cursor-pointer"
          >
            <PlusCircle size={14} /> New Plan
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <SavingsCard key={plan.id} {...plan} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
