import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components';
import { Search, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { transactionApi } from '@/lib/api';

import type { SavingsTransaction as Transaction } from '@/types';

export default function TransactionsPage() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'auto-save'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [pagination, setPagination] = useState<{
    totalItems: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!token) return;
      try {
        setIsLoading(true);
        const data = await transactionApi.getTransactions(token, {
          page,
          limit: 10,
          type: filterType,
          search: debouncedSearchQuery,
        });
        setTransactions(data.transactions);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error('Failed to load transaction history', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, [token, page, filterType, debouncedSearchQuery]);

  const handleFilterChange = (type: 'all' | 'deposit' | 'auto-save') => {
    setFilterType(type);
    setPage(1);
  };

  const filtered = transactions;

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

          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center justify-between gap-2 px-4 py-2 w-full sm:w-44 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all cursor-pointer shadow-sm focus:outline-none focus:border-primary"
            >
              <span className="capitalize">
                {filterType === 'all' ? 'All Logs' : filterType}
              </span>
              <ChevronDown
                size={14}
                className={`text-muted-foreground transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isDropdownOpen && (
              <>
                {/* Backdrop to close dropdown on click outside */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                />
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-1.5 w-full sm:w-44 bg-card border border-border rounded-xl shadow-elevated z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  {(['all', 'deposit', 'auto-save'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        handleFilterChange(type);
                        setIsDropdownOpen(false);
                      }}
                      className={`flex w-full text-left px-4 py-2 text-xs font-bold transition-colors cursor-pointer capitalize ${
                        filterType === type
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      {type === 'all' ? 'All Logs' : type}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-max min-w-full text-left text-xs font-semibold text-foreground">
                <thead>
                  <tr className="text-muted-foreground border-b border-border/60">
                    <th className="py-3 pr-6 whitespace-nowrap font-bold">Transaction ID</th>
                    <th className="py-3 pr-6 whitespace-nowrap font-bold">Goal Plan</th>
                    <th className="py-3 pr-6 whitespace-nowrap font-bold">Amount</th>
                    <th className="py-3 pr-6 whitespace-nowrap font-bold">Type</th>
                    <th className="py-3 pr-6 whitespace-nowrap font-bold">Status</th>
                    <th className="py-3 whitespace-nowrap font-bold text-right">Date/Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 overflow-x-scroll">
                  {filtered.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td
                        className="py-3 pr-6 whitespace-nowrap text-muted-foreground font-mono"
                        title={tx.id}
                      >
                        {tx.id.slice(0, 8)}...{tx.id.slice(-4)}
                      </td>
                      <td
                        className="py-3 pr-6 whitespace-nowrap font-bold text-foreground truncate max-w-[150px]"
                        title={tx.planTitle}
                      >
                        {tx.planTitle.length > 20 ? `${tx.planTitle.slice(0, 20)}...` : tx.planTitle}
                      </td>
                      <td className="py-3 pr-6 whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-bold">
                        +{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 pr-6 whitespace-nowrap">
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
                      <td className="py-3 pr-6 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 whitespace-nowrap text-right text-muted-foreground font-normal">
                        {(() => {
                          const d = new Date(tx.date);
                          if (isNaN(d.getTime())) return tx.date;
                          const datePart = d.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          });
                          const timePart = d.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          });
                          return `${datePart} • ${timePart}`;
                        })()}
                      </td>
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
          )}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/40">
              <p className="text-xs font-semibold text-muted-foreground">
                Showing page <span className="font-bold text-foreground">{pagination.currentPage}</span> of{' '}
                <span className="font-bold text-foreground">{pagination.totalPages}</span> ({pagination.totalItems} entries)
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-border bg-card hover:bg-muted text-foreground transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
