import type { SavingsPlan } from '@/types';
import { Link } from 'react-router-dom';

export default function SavingsCard({
  title,
  currentBalance,
  targetAmount,
  savingPlan,
  teamLogo,
  teamName,
}: SavingsPlan) {
  const percentage = Math.min(Math.round((currentBalance / targetAmount) * 100), 100);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card hover:border-primary/20 transition-all duration-300 flex flex-col justify-between h-[175px] relative overflow-hidden">
      <div>
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {savingPlan === 'fantasy-savings' && teamLogo ? (
              <img
                src={teamLogo}
                alt={teamName}
                className="h-8 w-8 object-contain rounded-lg bg-muted/40 p-1 border border-border/30 shrink-0"
              />
            ) : null}
            <div className="min-w-0">
              <h3 className="font-bold text-foreground text-sm truncate" title={title}>
                {title}
              </h3>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5 tracking-wider">
                {savingPlan === 'fantasy-savings' ? 'Fantasy Savings' : 'Vault Savings'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden relative">
            <div
              style={{ width: `${percentage}%` }}
              className={`h-full rounded-full ${
                savingPlan === 'fantasy-savings'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-primary to-indigo-500'
              }`}
            />
          </div>

          <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground font-semibold">
            <span className="font-bold text-foreground">{formatCurrency(currentBalance)}</span>
            <span>of {formatCurrency(targetAmount)}</span>
          </div>
          <Link
            to={`/dashboard/plans/${title}`}
            className="text-primary text-xs mt-2.5 block font-bold hover:underline"
          >
            View Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
