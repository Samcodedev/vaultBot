import { useState, useEffect } from 'react';
import { DashboardLayout, SavingsCard } from '@/components';
import { PlusCircle, Loader2 } from 'lucide-react';
import type { SavingsPlan as Plan } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { planApi } from '@/lib/api';
import { toast } from 'sonner';

export default function PlansPage() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      if (!token) return;
      try {
        setIsLoading(true);
        const data = await planApi.getPlans(token);
        setPlans(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load savings plans';
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [token]);

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
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-elevated cursor-pointer hover:opacity-90 transition-all"
          >
            <PlusCircle size={14} /> New Plan
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/40 p-6 space-y-3">
            <p className="text-sm text-muted-foreground font-semibold">No savings plans found.</p>
            <p className="text-xs text-muted-foreground">
              Create a new savings plan to start automation.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <SavingsCard key={plan.id} {...plan} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
