import { useState } from 'react';
import { DashboardLayout } from '@/components';
import { Search } from 'lucide-react';

import type { SavingsTransaction as Transaction } from '@/types';

export default function TransactionsPage() {
  const [transactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('vb_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'auto-save'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = transactions.filter((tx) => {
    const matchesFilter = filterType === 'all' || tx.type === filterType;
    const matchesSearch = tx.planTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Transaction Logs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit log of your deposits and auto-savings transactions
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-card border border-border p-3.5 rounded-2xl shadow-card">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by goal name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs rounded-xl border border-border bg-muted/20 pl-9 pr-3 py-2 text-foreground font-semibold placeholder-muted-foreground/60 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto justify-end">
            {(['all', 'deposit', 'auto-save'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer capitalize ${
                  filterType === type
                    ? 'gradient-primary text-white border-transparent shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                {type === 'all' ? 'All Logs' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-foreground">
              <thead>
                <tr className="text-muted-foreground border-b border-border/60 pb-2">
                  <th className="py-3 font-bold">Transaction ID</th>
                  <th className="py-3 font-bold">Goal Plan</th>
                  <th className="py-3 font-bold">Amount</th>
                  <th className="py-3 font-bold">Type</th>
                  <th className="py-3 font-bold">Status</th>
                  <th className="py-3 font-bold text-right">Date/Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 text-muted-foreground font-mono">{tx.id}</td>
                    <td className="py-3 font-bold text-foreground">{tx.planTitle}</td>
                    <td className="py-3 text-emerald-600 dark:text-emerald-400 font-bold">
                      +{formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          tx.type === 'auto-save'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-muted-foreground font-normal">{tx.date}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground font-semibold"
                    >
                      No matching transaction logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
