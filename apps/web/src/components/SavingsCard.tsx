import type { SavingsPlan } from '@/types';
import { Link } from 'react-router-dom';

export default function SavingsCard({ title, currentBalance, targetAmount }: SavingsPlan) {
  const percentage = Math.min(Math.round((currentBalance / targetAmount) * 100), 100);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card hover:border-primary/20 transition-all duration-300 flex flex-col justify-between h-[150px]">
      <div>
        <h3 className="font-bold text-foreground text-base truncate" title={title}>
          {title}
        </h3>

        <div className="mt-4">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden relative">
            <div
              style={{ width: `${percentage}%` }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500"
            />
          </div>

          <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground font-semibold">
            <span className="font-bold text-foreground">{formatCurrency(currentBalance)}</span>
            <span>of {formatCurrency(targetAmount)}</span>
          </div>
          <Link to={`/dashboard/plans/${title}`} className="text-primary text-xs mt-[10px] block">
            View Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
