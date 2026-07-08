import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  Clock,
  PiggyBank,
  Trash2,
  Trophy,
  Activity,
  Percent,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  PlayCircle,
  Copy,
  Landmark,
} from 'lucide-react';
import type { SavingsPlan as Plan, SavingsTransaction as Transaction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { planApi, transactionApi, nombaApi } from '@/lib/api';
import { teams } from '../../../../data/team.data';
const NIGERIAN_BANKS = [
  {
    code: '058',
    name: 'Guaranty Trust Bank',
    abbreviation: 'GTBank',
    logoColor: 'bg-orange-600/10 text-orange-600',
  },
  {
    code: '011',
    name: 'First Bank of Nigeria',
    abbreviation: 'FirstBank',
    logoColor: 'bg-amber-600/10 text-amber-600',
  },
  {
    code: '057',
    name: 'Zenith Bank',
    abbreviation: 'Zenith',
    logoColor: 'bg-red-600/10 text-red-600',
  },
  {
    code: '044',
    name: 'Access Bank',
    abbreviation: 'Access',
    logoColor: 'bg-orange-500/10 text-orange-500',
  },
  {
    code: '033',
    name: 'United Bank for Africa',
    abbreviation: 'UBA',
    logoColor: 'bg-red-700/10 text-red-700',
  },
  {
    code: '070',
    name: 'Fidelity Bank',
    abbreviation: 'Fidelity',
    logoColor: 'bg-blue-800/10 text-blue-800',
  },
  {
    code: '050',
    name: 'Ecobank Nigeria',
    abbreviation: 'Ecobank',
    logoColor: 'bg-blue-600/10 text-blue-600',
  },
  {
    code: '082',
    name: 'Wema Bank',
    abbreviation: 'Wema',
    logoColor: 'bg-purple-600/10 text-purple-600',
  },
  {
    code: '214',
    name: 'First City Monument Bank',
    abbreviation: 'FCMB',
    logoColor: 'bg-yellow-600/10 text-yellow-600',
  },
  {
    code: '50211',
    name: 'Kuda Bank',
    abbreviation: 'Kuda',
    logoColor: 'bg-emerald-600/10 text-emerald-600',
  },
  {
    code: '100026',
    name: 'Nombank MFB (Nomba)',
    abbreviation: 'Nomba',
    logoColor: 'bg-violet-600/10 text-violet-600',
  },
];
export default function PlanDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isSetupMandateSubpage = pathname.endsWith('/setup-mandate');
  const { token, user } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedPlanId, setCopiedPlanId] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncTransactions = async () => {
    if (!token) return;
    try {
      setIsSyncing(true);
      const res = await nombaApi.syncTransactions(token);
      if (res.credited > 0) {
        toast.success(`✅ ${res.message}`);
        await fetchPlanDetails(false);
      } else {
        toast.info(res.message || 'All transactions are already up to date.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to sync. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyText = (text: string, type: 'account' | 'plan') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      toast.success('Account number copied to clipboard');
      setTimeout(() => setCopiedAccount(false), 2000);
    } else {
      setCopiedPlanId(true);
      toast.success('Plan ID copied to clipboard');
      setTimeout(() => setCopiedPlanId(false), 2000);
    }
  };
  const [customerAccountNumber, setCustomerAccountNumber] = useState(user?.accountNumber || '');
  const [bankCode, setBankCode] = useState('058');
  const [customerAccountName, setCustomerAccountName] = useState(
    user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
  );
  const [customerAddress, setCustomerAddress] = useState('Lagos');
  const [isSettingUpMandate, setIsSettingUpMandate] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isTriggeringDebit, setIsTriggeringDebit] = useState(false);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [progressionMessage, setProgressionMessage] = useState<string | null>(null);
  const fetchPlanDetails = useCallback(
    async (showSkeleton = true) => {
      if (!token || !id) return;
      try {
        if (showSkeleton) setIsLoading(true);
        const data = await planApi.getPlanById(id, token);
        setPlan(data);
        const txData = await transactionApi.getPlanTransactions(id, token);
        setTransactions(txData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load plan details';
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [id, token],
  );
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPlanDetails(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchPlanDetails]);
  if (isLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-40">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }
  if (!plan) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto text-center py-16 space-y-6">
          <div className="p-4 rounded-2xl bg-destructive/10 text-destructive w-fit mx-auto">
            <PiggyBank size={40} />
          </div>
          <h2 className="text-2xl font-extrabold text-foreground">Savings Plan Not Found</h2>
          <p className="text-sm text-muted-foreground">
            The savings plan you are trying to view does not exist or has been deleted.
          </p>
          <button
            onClick={() => navigate('/dashboard/plans')}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-elevated cursor-pointer hover:opacity-95 transition-all inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Back to Savings Plans
          </button>
        </div>
      </DashboardLayout>
    );
  }
  const planTransactions = transactions.filter(
    (tx) => tx.planTitle.toLowerCase() === plan.title.toLowerCase(),
  );
  const percentage = Math.min(Math.round((plan.currentBalance / plan.targetAmount) * 100), 100);
  const remainingAmount = Math.max(plan.targetAmount - plan.currentBalance, 0);
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(value);
  };
  const getNextDebitDateText = () => {
    if (plan.nextDebitDate) {
      return new Date(plan.nextDebitDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      });
    }
    const now = new Date();
    const scheduleTime = plan.debitScheduleTime || '10:00 AM';
    const timeMatch = scheduleTime.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
    let hours = 10;
    let minutes = 0;
    if (timeMatch) {
      hours = parseInt(timeMatch[1], 10);
      minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3]?.toUpperCase();
      if (ampm) {
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
      }
    }
    const next = new Date();
    next.setHours(hours, minutes, 0, 0);
    if (next <= now) {
      if (plan.savingType === 'daily') next.setDate(next.getDate() + 1);
      else if (plan.savingType === 'weekly') next.setDate(next.getDate() + 7);
      else if (plan.savingType === 'monthly') next.setMonth(next.getMonth() + 1);
      else if (plan.savingType === 'yearly') next.setFullYear(next.getFullYear() + 1);
      else next.setDate(next.getDate() + 1);
    }
    return next.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };
  const getNextFixtureMock = (teamName: string) => {
    const opponents = [
      'Arsenal',
      'Chelsea',
      'Liverpool',
      'Manchester United',
      'Manchester City',
      'Tottenham',
      'Aston Villa',
      'Newcastle',
      'West Ham',
      'Brighton',
    ];
    const filteredOpponents = opponents.filter(
      (opp) => opp.toLowerCase() !== teamName.toLowerCase(),
    );
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const opponentIndex = Math.abs(hash) % filteredOpponents.length;
    const opponent = filteredOpponents[opponentIndex];
    const isHome = hash % 2 === 0;
    const teamInfo = teams.find((t) => t.name.toLowerCase() === teamName.toLowerCase());
    const oppInfo = teams.find((t) => t.name.toLowerCase() === opponent.toLowerCase());
    const opponentLogo = oppInfo?.logo;
    const teamLogo = teamInfo?.logo || plan.teamLogo;
    const matchDate = new Date();
    const daysUntilWeekend = (6 - matchDate.getDay() + 7) % 7 || 7;
    matchDate.setDate(matchDate.getDate() + daysUntilWeekend);
    matchDate.setHours(16, 0, 0, 0);
    const formattedMatchDate = matchDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
    return {
      opponent,
      isHome,
      formattedMatchDate,
      homeTeam: isHome ? teamName : opponent,
      awayTeam: isHome ? opponent : teamName,
      homeLogo: isHome ? teamLogo : opponentLogo,
      awayLogo: isHome ? opponentLogo : teamLogo,
    };
  };
  const handleMandateSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !id) return;
    if (!customerAccountNumber || customerAccountNumber.length !== 10) {
      toast.error('Please enter a valid 10-digit account number');
      return;
    }
    if (!customerAccountName) {
      toast.error('Account name is required');
      return;
    }
    try {
      setIsSettingUpMandate(true);
      setProgressionMessage('Initiating bank direct debit mandate...');
      await nombaApi.createDirectDebitMandate(
        {
          planId: id,
          customerAccountNumber,
          bankCode,
          customerAddress,
          customerAccountName,
        },
        token,
      );
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setProgressionMessage('Registering mandate reference with NIBSS gateway...');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setProgressionMessage('Authorizing N50 validation fee transfer...');
      await new Promise((resolve) => setTimeout(resolve, 1800));
      setProgressionMessage('Verifying validation status and activating schedule...');
      await nombaApi.checkMandateStatus(id, token);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setProgressionMessage('Success! Bank mandate is fully active...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Bank account linked and Direct Debit mandate activated successfully!');
      if (isSetupMandateSubpage) {
        navigate(`/dashboard/plans/${id}`);
      } else {
        await fetchPlanDetails(false);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to set up direct debit mandate';
      toast.error(errorMessage);
    } finally {
      setIsSettingUpMandate(false);
      setProgressionMessage(null);
    }
  };
  const handleCheckMandateStatus = async () => {
    if (!token || !id) return;
    try {
      setIsCheckingStatus(true);
      const res = await nombaApi.checkMandateStatus(id, token);
      if (res.autoSaveEnabled) {
        toast.success(
          'Your direct debit mandate has been successfully validated and is now ACTIVE!',
        );
      } else {
        toast.info(
          `Validation Status: Mandate is ${res.mandateStatus || 'PENDING'}, advice is ${
            res.mandateAdviceStatus || 'NOT SENT'
          }. Make sure you transferred N50 to validate.`,
        );
      }
      await fetchPlanDetails(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check mandate status';
      toast.error(errorMessage);
    } finally {
      setIsCheckingStatus(false);
    }
  };
  const handleTriggerDebit = async () => {
    if (!token || !id || !plan) return;
    try {
      setIsTriggeringDebit(true);
      const res = await nombaApi.debitMandate(id, token);
      toast.success(
        `Successfully processed auto-save of ${formatCurrency(
          res.amount || plan.amount || 0,
        )} using direct debit!`,
      );
      await fetchPlanDetails(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to process direct debit payment';
      toast.error(errorMessage);
    } finally {
      setIsTriggeringDebit(false);
    }
  };
  const handleDeletePlan = () => {
    toast.error('Deleting savings plans is not supported yet.');
    setIsConfirmingDelete(false);
  };
  const selectedBank = NIGERIAN_BANKS.find((b) => b.code === bankCode) || NIGERIAN_BANKS[0];
  const renderMandateCard = () => {
    if (!plan) return null;
    if (progressionMessage) {
      return (
        <div className="rounded-2xl border border-border bg-card p-8 shadow-card flex flex-col items-center justify-center text-center space-y-6 min-h-[300px] transition-all">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/25 blur-xl animate-pulse w-16 h-16" />
            <Loader2 className="h-12 w-12 text-primary animate-spin relative z-10" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h4 className="font-extrabold text-foreground text-sm">Automating Your Goal</h4>
            <p className="text-xs text-muted-foreground font-semibold leading-relaxed animate-pulse">
              {progressionMessage}
            </p>
          </div>
        </div>
      );
    }
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
        <div className="flex items-center justify-between border-b border-border/40 pb-4">
          <div>
            <h3 className="font-bold text-foreground text-base">
              Auto-Save Automation (Nomba Direct Debit)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Link your bank account to automate savings installments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border ${
                plan.autoSaveEnabled
                  ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                  : plan.mandateId
                    ? 'text-amber-500 bg-amber-500/10 border-amber-500/20 animate-pulse'
                    : 'text-muted-foreground bg-muted border-border'
              }`}
            >
              {plan.autoSaveEnabled
                ? 'Active'
                : plan.mandateId
                  ? 'Pending N50 Validation'
                  : 'Inactive'}
            </span>
          </div>
        </div>
        {!plan.mandateId ? (
          <form onSubmit={handleMandateSetupSubmit} className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
              Connect your personal bank account to configure automated debits of{' '}
              <strong>{formatCurrency(plan.amount || 0)}</strong> every{' '}
              <strong>{plan.savingType}</strong>. Once submitted, you'll need to transfer ₦50 to
              activate the mandate.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Bank Name
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                    className="w-full text-left text-sm rounded-xl border border-border bg-muted/20 px-3.5 py-3 text-foreground font-semibold focus:outline-none focus:border-primary flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-6 w-6 rounded-md flex items-center justify-center font-bold text-[9px] ${selectedBank.logoColor}`}
                      >
                        {selectedBank.abbreviation}
                      </span>
                      <span>{selectedBank.name}</span>
                    </div>
                    <span className="text-muted-foreground text-[10px]">▼</span>
                  </button>
                  {isBankDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => {
                          setIsBankDropdownOpen(false);
                          setBankSearchQuery('');
                        }}
                      />
                      <div className="absolute z-20 mt-1.5 w-full rounded-xl border border-border bg-card shadow-elevated p-2 space-y-2">
                        <input
                          type="text"
                          placeholder="Search bank..."
                          value={bankSearchQuery}
                          onChange={(e) => setBankSearchQuery(e.target.value)}
                          className="w-full text-xs rounded-lg border border-border bg-muted/20 px-3 py-2 text-foreground font-semibold focus:outline-none focus:border-primary"
                        />
                        <div className="max-h-48 overflow-y-auto divide-y divide-border/30 pr-1">
                          {NIGERIAN_BANKS.filter(
                            (b) =>
                              b.name.toLowerCase().includes(bankSearchQuery.toLowerCase()) ||
                              b.abbreviation.toLowerCase().includes(bankSearchQuery.toLowerCase()),
                          ).map((b) => (
                            <button
                              key={b.code}
                              type="button"
                              onClick={() => {
                                setBankCode(b.code);
                                setIsBankDropdownOpen(false);
                                setBankSearchQuery('');
                              }}
                              className="w-full text-left text-xs font-semibold px-3 py-2.5 rounded-lg hover:bg-muted transition-colors flex items-center justify-between group cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-6 w-6 rounded-md flex items-center justify-center font-bold text-[9px] ${b.logoColor}`}
                                >
                                  {b.abbreviation}
                                </span>
                                <span className="text-foreground group-hover:text-primary transition-colors">
                                  {b.name}
                                </span>
                              </div>
                              {bankCode === b.code && (
                                <span className="text-primary font-bold">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. 0123456789"
                  value={customerAccountNumber}
                  onChange={(e) => setCustomerAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-sm rounded-xl border border-border bg-muted/20 px-3.5 py-3 text-foreground font-semibold placeholder-muted-foreground/60 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Account Name (Registered with Bank)
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={customerAccountName}
                  onChange={(e) => setCustomerAccountName(e.target.value)}
                  className="w-full text-sm rounded-xl border border-border bg-muted/20 px-3.5 py-3 text-foreground font-semibold placeholder-muted-foreground/60 focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Customer Billing Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Lagos"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full text-sm rounded-xl border border-border bg-muted/20 px-3.5 py-3 text-foreground font-semibold placeholder-muted-foreground/60 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSettingUpMandate}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl gradient-primary text-white text-xs font-bold shadow-elevated hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSettingUpMandate ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Initiating Mandate...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    Set Up Automated Direct Debit
                  </>
                )}
              </button>
            </div>
          </form>
        ) : !plan.autoSaveEnabled ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 flex gap-3 text-amber-600 dark:text-amber-400 text-xs font-semibold leading-relaxed">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Validation Transfer Required</p>
                <p className="mt-1">
                  Your mandate has been successfully initiated. To complete the NIBSS validation:
                </p>
                <ul className="list-disc pl-4 mt-1.5 space-y-1 font-medium">
                  <li>
                    Please transfer exactly <strong>₦50</strong> as validation fee.
                  </li>
                  <li>
                    Refer to the validation instructions or transfer to your dedicated virtual bank
                    details.
                  </li>
                  <li>
                    Mandate status will show <strong>ACTIVE</strong> once NIBSS registers
                    validation.
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 gap-3">
              <button
                type="button"
                onClick={handleCheckMandateStatus}
                disabled={isCheckingStatus}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold cursor-pointer transition-all disabled:opacity-50 shadow-sm"
              >
                {isCheckingStatus ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                Check Validation Status
              </button>
              {isSetupMandateSubpage && (
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/plans/${id}`)}
                  className="flex items-center gap-1.5 px-5 py-3 rounded-xl gradient-primary text-white text-xs font-bold shadow-elevated hover:opacity-90 cursor-pointer transition-all"
                >
                  Go to Goal Details →
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 flex gap-3 text-emerald-600 dark:text-emerald-400 text-xs font-semibold leading-relaxed">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">Auto-Save Active</p>
                <p className="mt-0.5">
                  Your automated Direct Debit savings is live! Installs of{' '}
                  <strong>{formatCurrency(plan.amount || 0)}</strong> will debit automatically
                  according to schedule.
                </p>
              </div>
            </div>
            <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/10 text-xs font-semibold text-foreground">
              <div className="grid grid-cols-3 border-b border-border/40 p-3 items-center">
                <span className="text-muted-foreground uppercase text-[9px] tracking-wider font-bold">
                  Schedule
                </span>
                <span className="col-span-2 text-right font-extrabold capitalize">
                  {plan.savingType}
                </span>
              </div>
              <div className="grid grid-cols-3 p-3 items-center">
                <span className="text-muted-foreground uppercase text-[9px] tracking-wider font-bold">
                  Installment
                </span>
                <span className="col-span-2 text-right font-extrabold">
                  {formatCurrency(plan.amount || 0)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2 gap-3">
              <button
                type="button"
                onClick={handleTriggerDebit}
                disabled={isTriggeringDebit}
                className="flex items-center gap-1.5 px-5 py-3 rounded-xl gradient-primary text-white text-xs font-bold shadow-elevated hover:opacity-90 cursor-pointer transition-all disabled:opacity-50"
              >
                {isTriggeringDebit ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Triggering Debit...
                  </>
                ) : (
                  <>
                    <PlayCircle size={14} />
                    Trigger Test Auto-Save Debit
                  </>
                )}
              </button>
              {isSetupMandateSubpage && (
                <button
                  type="button"
                  onClick={() => navigate(`/dashboard/plans/${id}`)}
                  className="flex items-center gap-1.5 px-5 py-3 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  Go to Goal Details →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  if (isSetupMandateSubpage) {
    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-2 py-4">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
              Link Your Bank Account
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed font-semibold">
              Set up automated direct debit mandates for your new plan{' '}
              <strong>{plan?.title}</strong> so we can start automating your savings.
            </p>
          </div>
          {renderMandateCard()}
          {/* Skip link */}
          {!plan?.autoSaveEnabled && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => navigate(`/dashboard/plans/${id}`)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground hover:underline transition-colors cursor-pointer"
              >
                Skip for now, go to plan details →
              </button>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard/plans')}
              className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-card"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
                  {plan.title}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    plan.savingPlan === 'fantasy-savings'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : 'bg-primary/10 text-primary border border-primary/20'
                  }`}
                >
                  {plan.savingPlan === 'fantasy-savings' ? 'Fantasy' : 'Vault'} Plan
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {plan.description || 'No description provided.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeletePlan}
                  className="px-3.5 py-2 bg-destructive text-white text-xs font-bold rounded-xl shadow-sm hover:bg-destructive/90 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={13} /> Confirm Delete
                </button>
                <button
                  onClick={() => setIsConfirmingDelete(false)}
                  className="px-3.5 py-2 border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="px-3.5 py-2 text-destructive border border-destructive/20 hover:bg-destructive/5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 size={13} /> Delete Goal
              </button>
            )}
          </div>
        </div>
        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Progress Card */}
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card relative overflow-hidden h-fit">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-foreground text-base">Savings Progress</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Target amount achievement rate
                  </p>
                </div>
                <div
                  className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 ${
                    plan.savingPlan === 'fantasy-savings'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <Percent size={14} />
                  <span>{percentage}% Saved</span>
                </div>
              </div>
              {/* Curated Gradients Progress Bar */}
              <div className="mt-8">
                <div className="w-full h-4 bg-muted rounded-full overflow-hidden relative shadow-inner">
                  <div
                    style={{ width: `${percentage}%` }}
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      plan.savingPlan === 'fantasy-savings'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md'
                        : 'bg-gradient-to-r from-primary to-indigo-500 shadow-md'
                    }`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-border/40">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Current Savings
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-foreground">
                    {formatCurrency(plan.currentBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Target Goal
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-foreground">
                    {formatCurrency(plan.targetAmount)}
                  </p>
                </div>
              </div>
            </div>
            {remainingAmount > 0 ? (
              <div className="mt-6 bg-muted/30 border border-border/40 rounded-xl p-3.5 text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Remaining target balance needed:</span>
                <span className="font-extrabold text-foreground">
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            ) : (
              <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span className="flex items-center gap-1">🎉 Target Goal Completed!</span>
                <span className="font-extrabold">{formatCurrency(plan.currentBalance)}</span>
              </div>
            )}
          </div>
          {/* Deposit Side Column */}
          <div className="space-y-6">
            {/* Manual Top-Up via Bank Transfer Card */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card space-y-5">
              <div>
                <h3 className="font-bold text-foreground text-base">Top Up via Bank Transfer</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Transfer manually from any banking app
                </p>
              </div>
              {user?.accountNumber ? (
                <div className="space-y-4">
                  <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/10 text-xs font-semibold text-foreground">
                    <div className="grid grid-cols-3 border-b border-border/40 p-3 items-center">
                      <span className="text-muted-foreground uppercase text-[9px] tracking-wider font-bold">
                        Bank Name
                      </span>
                      <span className="col-span-2 text-right font-extrabold text-foreground">
                        {user.bankName || 'Nombank MFB'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 border-b border-border/40 p-3 items-center">
                      <span className="text-muted-foreground uppercase text-[9px] tracking-wider font-bold">
                        Account Name
                      </span>
                      <span className="col-span-2 text-right font-extrabold text-foreground truncate block">
                        {user.bankAccountName || `${user.firstName} ${user.lastName}`}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 p-3 items-center">
                      <span className="text-muted-foreground uppercase text-[9px] tracking-wider font-bold">
                        Account No.
                      </span>
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <span className="font-mono font-extrabold text-foreground">
                          {user.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(user.accountNumber || '', 'account')}
                          className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                          title="Copy Account Number"
                        >
                          {copiedAccount ? (
                            <CheckCircle2 size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl space-y-2">
                    <p className="text-[11px] text-foreground font-bold leading-relaxed">
                      💡 How to direct funds to this plan:
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                      Copy and paste the Plan ID or Plan Name below into the{' '}
                      <strong>transfer narration/description</strong> in your bank app so we can
                      route the top-up correctly:
                    </p>
                    <div className="flex items-center justify-between gap-2 bg-card border border-border p-2 rounded-lg text-[10px]">
                      <span className="font-mono font-bold truncate text-muted-foreground">
                        Plan ID: {plan.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(plan.id, 'plan')}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                        title="Copy Plan ID"
                      >
                        {copiedPlanId ? (
                          <CheckCircle2 size={10} className="text-emerald-500" />
                        ) : (
                          <Copy size={10} />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Verify Payment Button */}
                  <button
                    type="button"
                    onClick={handleSyncTransactions}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/5 text-primary text-xs font-bold hover:bg-primary/10 hover:border-primary/50 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        Syncing payments…
                      </>
                    ) : (
                      <>
                        <RefreshCw size={13} />
                        Verify Payment
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 flex gap-3 text-amber-600 dark:text-amber-400 text-xs font-semibold leading-relaxed">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-foreground">Virtual Account Required</p>
                      <p className="mt-1 font-medium text-muted-foreground">
                        You need a Nomba virtual account to connect automated triggers and perform
                        manual top-ups.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/profile')}
                    className="w-full py-3 rounded-xl gradient-primary text-white text-xs font-bold shadow-elevated hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Landmark size={14} /> Set Up Virtual Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Savings Strategy and Associated Team Info */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Next Debit Schedule Card */}
          {plan.savingPlan !== 'fantasy-savings' ? (
            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                <h3 className="font-bold text-foreground text-base">Next Debit Schedule</h3>
                <span className="flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  <Clock size={12} />
                  Automated Vault Debit
                </span>
              </div>
              {/* Details table format */}
              <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/10 text-xs font-semibold text-foreground">
                <div className="grid grid-cols-3 border-b border-border/40 p-3 items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5 uppercase text-[9px] tracking-wider font-bold">
                    <Calendar size={13} className="text-primary" />
                    Next Debit Date
                  </span>
                  <span className="col-span-2 text-right font-extrabold">
                    {getNextDebitDateText()}
                  </span>
                </div>
                <div className="grid grid-cols-3 border-b border-border/40 p-3 items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5 uppercase text-[9px] tracking-wider font-bold">
                    <PiggyBank size={13} className="text-primary" />
                    Debit Amount
                  </span>
                  <span className="col-span-2 text-right font-extrabold">
                    {formatCurrency(plan.amount || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-3 items-center">
                  <span className="text-muted-foreground flex items-center gap-1.5 uppercase text-[9px] tracking-wider font-bold">
                    <Clock size={13} className="text-primary" />
                    Cycle Frequency
                  </span>
                  <span className="col-span-2 text-right font-extrabold capitalize">
                    {plan.savingType}{' '}
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      at {plan.debitScheduleTime || '10:00 AM'}
                    </span>
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground font-medium bg-primary/5 border border-primary/10 rounded-xl p-3.5 leading-relaxed">
                Automated debits run based on your saving frequency (
                <strong>{plan.savingType}</strong>) at{' '}
                <strong>{plan.debitScheduleTime || '10:00 AM'}</strong>. You can adjust your target,
                manually top-up, or delete the goal using the control panels.
              </div>
            </div>
          ) : (
            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                <h3 className="font-bold text-foreground text-base">Next Debit Schedule</h3>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <Trophy size={12} />
                  Match Play Trigger
                </span>
              </div>
              {plan.teamName ? (
                plan.nextFixtureId === null ? (
                  <div className="space-y-5">
                    <p className="text-xs text-muted-foreground leading-relaxed bg-amber-500/5 border border-amber-500/10 rounded-xl p-4">
                      ⚠️ <strong>Match schedule is not yet available</strong>. This savings plan is
                      linked to <strong>{plan.teamName}</strong>, but the Premier League is
                      currently on break. Your automated savings will start as soon as the match
                      schedule is released and the next fixture is updated.
                    </p>
                    <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/10 text-xs font-semibold text-foreground">
                      <div className="grid grid-cols-3 border-b border-border/40 p-3 items-center">
                        <span className="text-muted-foreground flex items-center gap-1.5 uppercase text-[9px] tracking-wider font-bold">
                          <Calendar size={13} className="text-amber-500" />
                          Fixture Schedule
                        </span>
                        <span className="col-span-2 text-right font-extrabold text-muted-foreground italic">
                          Fixture not yet available
                        </span>
                      </div>
                      <div className="grid grid-cols-3 p-3 items-center">
                        <span className="text-muted-foreground flex items-center gap-1.5 uppercase text-[9px] tracking-wider font-bold">
                          <Trophy size={13} className="text-amber-500" />
                          Win Savings Debit
                        </span>
                        <span className="col-span-2 text-right font-extrabold">
                          {formatCurrency(plan.amount || 0)}{' '}
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            ({plan.teamName} win)
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  (() => {
                    const fixture = getNextFixtureMock(plan.teamName);
                    return (
                      <div className="space-y-5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Upcoming Premier League Matchplay
                        </p>
                        {/* Visual matchup board */}
                        <div className="rounded-xl border border-border bg-muted/30 p-5 flex items-center justify-between gap-4 relative overflow-hidden">
                          {/* Home team */}
                          <div className="flex-1 flex flex-col items-center text-center gap-2">
                            {fixture.homeLogo ? (
                              <img
                                src={fixture.homeLogo}
                                alt={fixture.homeTeam}
                                className="h-14 w-14 object-contain"
                              />
                            ) : (
                              <div className="h-14 w-14 rounded-full bg-muted border border-border flex items-center justify-center font-extrabold text-xs text-muted-foreground">
                                Club
                              </div>
                            )}
                            <span className="text-xs font-bold text-foreground line-clamp-1">
                              {fixture.homeTeam}
                            </span>
                            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                              {fixture.isHome ? 'Home' : 'Away'}
                            </span>
                          </div>
                          {/* VS center indicator */}
                          <div className="flex flex-col items-center gap-1 justify-center shrink-0">
                            <span className="text-base font-black text-muted-foreground/40 italic">
                              VS
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-foreground text-background text-[8px] font-bold tracking-widest uppercase">
                              PL
                            </span>
                          </div>
                          {/* Away team */}
                          <div className="flex-1 flex flex-col items-center text-center gap-2">
                            {fixture.awayLogo ? (
                              <img
                                src={fixture.awayLogo}
                                alt={fixture.awayTeam}
                                className="h-14 w-14 object-contain"
                              />
                            ) : (
                              <div className="h-14 w-14 rounded-full bg-muted border border-border flex items-center justify-center font-extrabold text-xs text-muted-foreground">
                                Club
                              </div>
                            )}
                            <span className="text-xs font-bold text-foreground line-clamp-1">
                              {fixture.awayTeam}
                            </span>
                            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                              {!fixture.isHome ? 'Home' : 'Away'}
                            </span>
                          </div>
                        </div>
                        {/* Details list/table format */}
                        <div className="border border-border/60 rounded-xl overflow-hidden bg-muted/10 text-xs font-semibold text-foreground">
                          <div className="grid grid-cols-3 border-b border-border/40 p-3 items-center">
                            <span className="text-muted-foreground flex items-center gap-1.5 uppercase text-[9px] tracking-wider font-bold">
                              <Calendar size={13} className="text-emerald-500" />
                              Fixture Schedule
                            </span>
                            <span className="col-span-2 text-right font-extrabold">
                              {fixture.formattedMatchDate}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 p-3 items-center">
                            <span className="text-muted-foreground flex items-center gap-1.5 uppercase text-[9px] tracking-wider font-bold">
                              <Trophy size={13} className="text-emerald-500" />
                              Win Savings Debit
                            </span>
                            <span className="col-span-2 text-right font-extrabold">
                              {formatCurrency(plan.amount || 0)}{' '}
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                ({plan.teamName} win)
                              </span>
                            </span>
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-medium bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5 leading-relaxed">
                          Matchday results are checked automatically. If{' '}
                          <strong>{plan.teamName}</strong> wins this fixture,{' '}
                          <strong>{formatCurrency(plan.amount || 0)}</strong> will be automatically
                          saved towards your goal. No debit occurs for draws or losses.
                        </div>
                      </div>
                    );
                  })()
                )
              ) : (
                <p className="text-xs text-muted-foreground">No linked team matches found.</p>
              )}
            </div>
          )}
          {/* Connected Football Team Details */}
          {plan.savingPlan === 'fantasy-savings' && plan.teamName ? (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-foreground text-base border-b border-border/40 pb-2">
                  Linked Team
                </h3>
                <div className="flex items-center gap-4 mt-5">
                  {(() => {
                    const teamInfo = teams.find(
                      (t) => t.name.toLowerCase() === plan.teamName?.toLowerCase(),
                    );
                    const logoUrl = plan.teamLogo || teamInfo?.logo;
                    return logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={plan.teamName}
                        className="h-16 w-16 object-contain bg-muted/30 rounded-2xl p-2 border border-border/60"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                        <Trophy size={28} />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-base font-extrabold text-foreground">{plan.teamName}</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-0.5">
                      Premier League
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-[10px] text-muted-foreground font-medium leading-relaxed">
                VaultBot queries official match results following Premier League matchdays to
                identify wins and automatically debit your vault.
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-foreground text-base border-b border-border/40 pb-2">
                  Plan Metadata
                </h3>
                <div className="space-y-3.5 mt-5">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-emerald-500 font-bold">Active</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="text-foreground">{plan.savingDuration || 'Ongoing'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-muted-foreground">Automated Debit</span>
                    <span className="text-foreground">{formatCurrency(plan.amount || 0)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-primary/5 border border-primary/10 rounded-xl p-3 text-[10px] text-muted-foreground font-medium leading-relaxed">
                Funds are secured and will continue to debit based on the frequency until target is
                achieved.
              </div>
            </div>
          )}
        </div>
        {/* Transactions Table for this goal */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
            <div>
              <h3 className="font-bold text-foreground text-base">Goal Activity Log</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit history of transactions for this savings plan
              </p>
            </div>
            <div className="p-2 rounded-xl bg-muted/40 border border-border/20 text-muted-foreground">
              <Activity size={16} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-foreground">
              <thead>
                <tr className="text-muted-foreground border-b border-border/40 pb-2">
                  <th className="py-2.5 font-bold">Transaction ID</th>
                  <th className="py-2.5 font-bold">Amount</th>
                  <th className="py-2.5 font-bold">Type</th>
                  <th className="py-2.5 font-bold">Status</th>
                  <th className="py-2.5 font-bold text-right">Date/Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {planTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 text-muted-foreground font-mono">{tx.id}</td>
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
                    <td className="py-3 text-right text-muted-foreground font-normal">
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
                {planTransactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground font-semibold"
                    >
                      No transactions recorded for this savings plan yet.
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
