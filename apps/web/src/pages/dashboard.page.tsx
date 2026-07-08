import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components';
import { Wallet, Target, TrendingUp, PlusCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { SavingsPlan as Plan, SavingsTransaction as Transaction } from '@/types';
import { planApi, transactionApi } from '@/lib/api';

export default function Dashboard() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!token) return;
      try {
        setIsLoading(true);
        const data = await planApi.getPlans(token);
        setPlans(data);

        const txData = await transactionApi.getTransactions(token);
        setTransactions(txData);
      } catch (err) {
        console.error('Failed to load dashboard statistics', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [token]);

  const totalSaved = plans.reduce((acc, curr) => acc + curr.currentBalance, 0);
  const activePlansCount = plans.length;
  const targetCompletedCount = plans.filter((p) => p.currentBalance >= p.targetAmount).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTransactionDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
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
  };

  const getGrowthData = () => {
    const completedTxs = [...transactions]
      .filter((t) => t.status === 'completed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (completedTxs.length === 0) {
      return [
        {
          name: 'Start',
          dateLabel: 'No transactions yet',
          Savings: 0,
          txAmount: 0,
          txTitle: 'N/A',
          txType: 'system',
        },
      ];
    }

    let cumulative = 0;
    const dataPoints = completedTxs.map((tx) => {
      cumulative += tx.amount;
      const d = new Date(tx.date);
      const dateLabel = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeLabel = d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return {
        name: `${dateLabel} • ${timeLabel} • ${tx.id}`,
        dateLabel: `${dateLabel} • ${timeLabel}`,
        Savings: cumulative,
        txAmount: tx.amount,
        txTitle: tx.planTitle,
        txType: tx.type,
      };
    });

    const firstTxDate = new Date(completedTxs[0].date);
    const startPointDate = new Date(firstTxDate);
    startPointDate.setDate(firstTxDate.getDate() - 1);

    const startPoint = {
      name: `Initial Balance • Start • system`,
      dateLabel: 'Initial Balance',
      Savings: 0,
      txAmount: 0,
      txTitle: 'Vault Setup',
      txType: 'system',
    };

    return [startPoint, ...dataPoints];
  };

  const growthData = getGrowthData();

  const getSavingsGrowthPercentage = () => {
    const sortedTxs = [...transactions]
      .filter((t) => t.status === 'completed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const now = new Date();
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(now.getMonth() - 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    let balanceLastMonth = 0;

    let cumulative = 0;
    sortedTxs.forEach((tx) => {
      const txDate = new Date(tx.date);
      cumulative += tx.amount;

      const isBeforeLastMonth =
        txDate.getFullYear() < lastMonthYear ||
        (txDate.getFullYear() === lastMonthYear && txDate.getMonth() < lastMonth);
      const isLastMonth = txDate.getFullYear() === lastMonthYear && txDate.getMonth() === lastMonth;

      if (isBeforeLastMonth || isLastMonth) {
        balanceLastMonth = cumulative;
      }
    });

    const balanceThisMonth = cumulative;
    const diff = balanceThisMonth - balanceLastMonth;

    if (balanceLastMonth === 0) {
      return balanceThisMonth > 0 ? '+100% growth' : 'No savings yet';
    }
    const pct = ((diff / balanceLastMonth) * 100).toFixed(1);
    return diff >= 0 ? `+${pct}% from last month` : `${pct}% from last month`;
  };

  const autoSaveTransactions = transactions.filter(
    (t) => t.type === 'auto-save' && t.status === 'completed',
  );
  const totalAutoSaved = autoSaveTransactions.reduce((acc, curr) => acc + curr.amount, 0);
  const avgAutoSaveAmount =
    autoSaveTransactions.length > 0 ? totalAutoSaved / autoSaveTransactions.length : 0;

  const totalTargetAmount = plans.reduce((acc, curr) => acc + curr.targetAmount, 0);
  const hasAutoSaveData = totalAutoSaved > 0;

  const distributionData = plans.map((p) => ({
    name: p.title,
    value: p.currentBalance,
  }));

  const COLORS = ['#1e40af', '#0d9488', '#d97706', '#8b5cf6'];

  const stats = [
    {
      label: 'Total Saved',
      value: formatCurrency(totalSaved),
      subtext: getSavingsGrowthPercentage(),
      icon: Wallet,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Active Plans',
      value: `${activePlansCount}`,
      subtext: `${targetCompletedCount} goal(s) completed`,
      icon: Target,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: hasAutoSaveData ? 'Total Target Goal' : 'Total Auto-Saved',
      value: formatCurrency(hasAutoSaveData ? totalTargetAmount : totalAutoSaved),
      subtext: hasAutoSaveData
        ? `Avg debit size: ${formatCurrency(avgAutoSaveAmount)}`
        : `Target amount for all plans`,
      icon: TrendingUp,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-40">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Savings Command Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 font-medium">
              Gamifying and Automating Wealth-Building
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/dashboard/create">
              <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-bold shadow-elevated hover:opacity-95 transition-all cursor-pointer">
                <PlusCircle size={16} />
                Create Plan
              </button>
            </Link>
          </div>
        </div>

        {/* Overview Stats Cards Grid */}
        <div className="grid gap-5 sm:grid-cols-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-md hover:border-primary/10 transition-all flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {s.label}
                </p>
                <p className="mt-1.5 text-2xl font-extrabold text-foreground tracking-tight">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground font-semibold">{s.subtext}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon size={22} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Analytics Section - Charts */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Area Chart - Savings Growth */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col justify-between min-h-[350px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-foreground text-base">Savings Trend</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Cumulative progress this year
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                <TrendingUp size={12} />
                Consistent growth
              </div>
            </div>
            <div className="flex-1 w-full h-[250px] min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217, 71%, 55%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(217, 71%, 55%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="rgba(148, 163, 184, 0.12)"
                  />
                  <XAxis
                    dataKey="name"
                    tickFormatter={(val) => {
                      if (!val) return '';
                      if (val.startsWith('Initial Balance')) return 'Start';
                      const parts = val.split(' • ');
                      if (parts.length > 0) {
                        return parts[0].split(',')[0];
                      }
                      return val;
                    }}
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `₦${val / 1000}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="linear"
                    dataKey="Savings"
                    stroke="hsl(217, 71%, 55%)"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSavings)"
                    dot={{
                      r: 3.5,
                      stroke: 'hsl(217, 71%, 55%)',
                      strokeWidth: 1.5,
                      fill: 'var(--color-card)',
                    }}
                    activeDot={{
                      r: 5.5,
                      stroke: 'hsl(217, 71%, 55%)',
                      strokeWidth: 2,
                      fill: 'hsl(217, 71%, 55%)',
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Allocation Breakdown - Pie Chart */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col justify-between min-h-[350px]">
            <div>
              <h3 className="font-bold text-foreground text-base">Goal Allocation</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Asset distribution by goals</p>
            </div>
            <div className="flex-1 w-full h-[220px] flex items-center justify-center mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {distributionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-card)',
                      borderColor: 'var(--color-border)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}
                    formatter={(
                      value: string | number | readonly (string | number)[] | undefined,
                    ) => [
                      formatCurrency(Number(Array.isArray(value) ? value[0] : value || 0)),
                      'Balance',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend to match aesthetics */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/60">
              {distributionData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span
                    className="text-[10px] font-bold text-muted-foreground truncate"
                    title={d.name}
                  >
                    {d.name} ({totalSaved > 0 ? Math.round((d.value / totalSaved) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle row: Recent Activity Logs */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Activity Logs */}
          <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
              <div>
                <h3 className="font-bold text-foreground text-base">Recent Activities</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your recent savings transactions
                </p>
              </div>
              <Link
                to="/dashboard/transactions"
                className="text-xs font-bold text-primary hover:underline"
              >
                View all transactions
              </Link>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs font-semibold text-foreground">
                <thead>
                  <tr className="text-muted-foreground border-b border-border/40 pb-2">
                    <th className="py-2.5 font-bold">Goal/Plan</th>
                    <th className="py-2.5 font-bold">Amount</th>
                    <th className="py-2.5 font-bold">Method</th>
                    <th className="py-2.5 font-bold">Status</th>
                    <th className="py-2.5 font-bold text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-muted-foreground font-semibold"
                      >
                        No recent transactions found.
                      </td>
                    </tr>
                  ) : (
                    transactions.slice(0, 4).map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 font-bold text-foreground">{tx.planTitle}</td>
                        <td className="py-3 text-emerald-600 dark:text-emerald-400">
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
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-muted-foreground">
                          {formatTransactionDate(tx.date)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      dateLabel: string;
      Savings: number;
      txAmount: number;
      txTitle: string;
      txType: string;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (data.txType === 'system') {
      return (
        <div className="rounded-2xl border border-border bg-card p-3 shadow-card text-xs font-semibold text-foreground">
          <p className="text-foreground font-black text-sm">Initial Balance: ₦0</p>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card text-xs font-semibold text-foreground space-y-1.5 min-w-[200px]">
        <div className="flex justify-between items-center gap-4">
          <span className="text-muted-foreground">Amount:</span>
          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
            +
            {new Intl.NumberFormat('en-NG', {
              style: 'currency',
              currency: 'NGN',
              maximumFractionDigits: 0,
            }).format(data.txAmount)}
          </span>
        </div>
        <div className="flex justify-between items-center gap-4">
          <span className="text-muted-foreground">Goal Plan:</span>
          <span className="font-extrabold text-foreground truncate max-w-[120px]">
            {data.txTitle}
          </span>
        </div>
      </div>
    );
  }
  return null;
};
