import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  Repeat,
  PenLine,
  Trophy,
  Landmark,
} from 'lucide-react';
import { teams } from '../../../../data/team.data';
import { useAuth } from '@/contexts/AuthContext';
import { planApi } from '@/lib/api';

const savingTypes = [
  { value: 'daily', label: 'Daily', desc: 'Save every day' },
  { value: 'weekly', label: 'Weekly', desc: 'Save every week' },
  { value: 'monthly', label: 'Monthly', desc: 'Save every month' },
  { value: 'yearly', label: 'Yearly', desc: 'Save every year' },
];

export default function CreatePlan() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [savingPlanSelected, setSavingPlanSelected] = useState(false);
  const [step, setStep] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetAmount: '',
    amount: '',
    savingType: 'monthly',
    savingDuration: '',
    debitScheduleTime: '10:00 AM',
    savingPlan: 'vault',
    teamName: '',
    teamLogo: '',
  });

  const steps =
    form.savingPlan === 'fantasy-savings'
      ? ['Goal', 'Trigger', 'Review']
      : ['Goal', 'Frequency', 'Schedule', 'Review'];

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const selectPlanType = (type: 'vault' | 'fantasy-savings') => {
    setForm((f) => ({
      ...f,
      savingPlan: type,
      teamName: type === 'vault' ? '' : f.teamName,
      teamLogo: type === 'vault' ? '' : f.teamLogo,
      title: type === 'vault' ? '' : f.title,
    }));
    setSavingPlanSelected(true);
    setStep(0);
  };

  const next = () => {
    if (step === 0) {
      if (form.savingPlan === 'fantasy-savings' && !form.teamName) {
        toast.error('Please select a football team');
        return;
      }
      if (!form.title) {
        toast.error('Please enter a title');
        return;
      }
      if (!form.targetAmount || Number(form.targetAmount) <= 0) {
        toast.error('Enter a valid target amount');
        return;
      }
    }

    if (form.savingPlan === 'vault') {
      if (step === 2) {
        if (!form.amount || Number(form.amount) <= 0) {
          toast.error('Enter a valid amount to save per schedule');
          return;
        }
        if (Number(form.amount) > Number(form.targetAmount)) {
          toast.error('Debit amount cannot be greater than the target amount');
          return;
        }
        if (!form.debitScheduleTime) {
          toast.error('Please enter a debit time');
          return;
        }
      }
    } else {
      // fantasy-savings
      if (step === 1) {
        if (!form.amount || Number(form.amount) <= 0) {
          toast.error('Enter a valid amount to save per win');
          return;
        }
        if (Number(form.amount) > Number(form.targetAmount)) {
          toast.error('Debit amount cannot be greater than the target amount');
          return;
        }
      }
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const back = () => {
    if (step === 0) {
      setSavingPlanSelected(false);
    } else {
      setStep((s) => Math.max(s - 1, 0));
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!token) {
      toast.error('You must be logged in to create a plan');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        title: form.title,
        description: form.description || undefined,
        targetAmount: Number(form.targetAmount),
        savingType: form.savingPlan === 'fantasy-savings' ? 'win-trigger' : form.savingType,
        savingPlan: form.savingPlan as 'vault' | 'fantasy-savings',
        amount: Number(form.amount),
        debitScheduleTime: form.savingPlan === 'vault' ? form.debitScheduleTime : undefined,
        teamName: form.savingPlan === 'fantasy-savings' ? form.teamName : undefined,
      };

      const newPlan = await planApi.createPlan(payload, token);
      toast.success(`Savings plan "${form.title}" created successfully!`);
      navigate(`/dashboard/plans/${newPlan.id}/setup-mandate`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create savings plan';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getVaultEstimation = () => {
    const target = Number(form.targetAmount) || 0;
    const saveAmount = Number(form.amount) || 0;
    if (target <= 0 || saveAmount <= 0) return null;

    const cycles = Math.ceil(target / saveAmount);
    const estDate = new Date();
    if (form.savingType === 'daily') {
      estDate.setDate(estDate.getDate() + cycles);
    } else if (form.savingType === 'weekly') {
      estDate.setDate(estDate.getDate() + cycles * 7);
    } else if (form.savingType === 'monthly') {
      estDate.setMonth(estDate.getMonth() + cycles);
    } else if (form.savingType === 'yearly') {
      estDate.setFullYear(estDate.getFullYear() + cycles);
    } else {
      estDate.setDate(estDate.getDate() + cycles);
    }

    return {
      cycles,
      formattedDate: estDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
  };

  const getFantasyEstimation = () => {
    const target = Number(form.targetAmount) || 0;
    const saveAmount = Number(form.amount) || 0;
    if (target <= 0 || saveAmount <= 0) return null;

    const winsNeeded = Math.ceil(target / saveAmount);
    const totalMatches = winsNeeded * 2;
    const estMonths = Math.round(totalMatches / 4.3);

    return {
      winsNeeded,
      totalMatches,
      estMonths: estMonths || 1,
      estWeeks: totalMatches,
    };
  };

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  // Filtered teams list for custom dropdown
  const filteredTeams = teams.filter((t) =>
    t.name.toLowerCase().includes(teamSearch.toLowerCase()),
  );

  return (
    <DashboardLayout>
      <div
        className={`mx-auto transition-all duration-300 ${savingPlanSelected ? 'max-w-lg' : 'max-w-2xl'}`}
      >
        {/* Initial Plan Type Selection (Not in flow wizard yet) */}
        <AnimatePresence mode="wait">
          {!savingPlanSelected ? (
            <motion.div
              key="plan-type-select"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 mt-4"
            >
              <div className="text-center">
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                  Choose a Savings Plan
                </h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  Select a method to automate your savings and reach your goals.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 mt-8 justify-center">
                {/* Vault Savings Option */}
                <button
                  type="button"
                  onClick={() => selectPlanType('vault')}
                  className="group flex-1 rounded-2xl border border-border bg-card p-6 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between hover:border-primary hover:shadow-card hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <div>
                    <div className="p-4 rounded-2xl bg-primary/10 text-primary w-fit group-hover:scale-105 transition-transform duration-300 shrink-0 mb-4">
                      <Landmark size={28} />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-extrabold text-card-foreground">Vault Savings</p>
                      <ArrowRight
                        size={16}
                        className="text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-semibold leading-relaxed">
                      Standard automated savings. Set aside a fixed amount at your preferred
                      frequency (daily, weekly, monthly) until your target is met.
                    </p>
                  </div>
                </button>

                {/* Fantasy Savings Option */}
                <button
                  type="button"
                  onClick={() => selectPlanType('fantasy-savings')}
                  className="group flex-1 rounded-2xl border border-border bg-card p-6 text-left transition-all duration-300 cursor-pointer flex flex-col justify-between hover:border-emerald-500 hover:shadow-card hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <div>
                    <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 w-fit group-hover:scale-105 transition-transform duration-300 shrink-0 mb-4">
                      <Trophy size={28} />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-extrabold text-card-foreground">Fantasy Savings</p>
                      <ArrowRight
                        size={16}
                        className="text-emerald-500 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-semibold leading-relaxed">
                      Link savings to your favorite Premier League team. Set an amount to save
                      automatically based on their match fixtures schedule.
                    </p>
                  </div>
                </button>
              </div>
            </motion.div>
          ) : (
            /* Multi-step saving plan wizard flow */
            <motion.div
              key="saving-plan-wizard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                  New {form.savingPlan === 'fantasy-savings' ? 'Fantasy' : 'Vault'} Saving Plan
                </h1>
                <button
                  onClick={() => setSavingPlanSelected(false)}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  Change Plan Type
                </button>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
                {steps.map((s, i) => (
                  <div key={s} className="flex items-center gap-1 shrink-0">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                        i <= step
                          ? form.savingPlan === 'fantasy-savings'
                            ? 'bg-emerald-500 text-white shadow-card'
                            : 'gradient-primary text-white shadow-card'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {i < step ? <Check size={14} /> : i + 1}
                    </div>
                    <span
                      className={`text-[10px] font-bold ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {s}
                    </span>
                    {i < steps.length - 1 && (
                      <div
                        className={`h-0.5 w-4 rounded transition-colors ${
                          i < step
                            ? form.savingPlan === 'fantasy-savings'
                              ? 'bg-emerald-500'
                              : 'bg-primary'
                            : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl border border-border bg-card p-6 shadow-card"
                >
                  {/* Step 0: Goal details & Target Amount */}
                  {step === 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-2 font-bold text-sm uppercase tracking-wider">
                        <PenLine size={18} />
                        <span>
                          {form.savingPlan === 'fantasy-savings'
                            ? 'Link your football team, details, and target'
                            : 'Set your savings goal details & target'}
                        </span>
                      </div>

                      {/* Custom dropdown for Fantasy Savings */}
                      {form.savingPlan === 'fantasy-savings' && (
                        <div className="mb-4">
                          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                            Select Premier League Team
                          </label>
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                              className="w-full flex items-center justify-between text-sm rounded-xl border border-border bg-muted/20 px-3.5 py-3 text-foreground font-semibold focus:outline-none focus:border-primary cursor-pointer text-left"
                            >
                              {form.teamName ? (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={form.teamLogo}
                                    alt=""
                                    className="h-6 w-6 object-contain"
                                  />
                                  <span>{form.teamName}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/60">Choose a team...</span>
                              )}
                              <ArrowRight size={16} className="rotate-90 text-muted-foreground" />
                            </button>

                            {isDropdownOpen && (
                              <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border bg-card shadow-lg p-2 max-h-60 overflow-y-auto space-y-1.5">
                                <div className="sticky top-0 bg-card pb-1.5 border-b border-border/40">
                                  <input
                                    type="text"
                                    value={teamSearch}
                                    onChange={(e) => setTeamSearch(e.target.value)}
                                    placeholder="Search team..."
                                    className="w-full text-xs rounded-lg border border-border bg-muted/30 px-2.5 py-2 text-foreground focus:outline-none focus:border-primary font-semibold"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>

                                <div className="pt-1.5 space-y-1">
                                  {filteredTeams.length > 0 ? (
                                    filteredTeams.map((t) => (
                                      <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => {
                                          update('teamName', t.name);
                                          update('teamLogo', t.logo);
                                          setIsDropdownOpen(false);
                                          setTeamSearch('');
                                        }}
                                        className="w-full flex items-center gap-3 px-2.5 py-2 text-xs font-semibold text-foreground hover:bg-primary/10 rounded-lg text-left transition-colors cursor-pointer"
                                      >
                                        <img
                                          src={t.logo}
                                          alt=""
                                          className="h-6 w-6 object-contain shrink-0"
                                        />
                                        <span>{t.name}</span>
                                      </button>
                                    ))
                                  ) : (
                                    <p className="text-xs text-muted-foreground p-2 text-center font-medium">
                                      No teams found
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          {form.savingPlan === 'fantasy-savings' ? 'Savings Title' : 'Title'}
                        </label>
                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) => update('title', e.target.value)}
                          placeholder={
                            form.savingPlan === 'fantasy-savings'
                              ? 'e.g. Chelsea Savings Plan'
                              : 'e.g. Vacation Fund'
                          }
                          className="w-full text-sm rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-foreground font-semibold placeholder-muted-foreground/60 focus:outline-none focus:border-primary mt-1"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Description (optional)
                        </label>
                        <textarea
                          value={form.description}
                          onChange={(e) => update('description', e.target.value)}
                          placeholder="A short note about this goal"
                          className="w-full text-sm rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-foreground font-semibold placeholder-muted-foreground/60 focus:outline-none focus:border-primary mt-1"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Target Amount (₦)
                        </label>
                        <input
                          type="number"
                          value={form.targetAmount}
                          onChange={(e) => update('targetAmount', e.target.value)}
                          placeholder="100000"
                          className="w-full text-sm rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-foreground font-semibold focus:outline-none focus:border-primary mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 1: Frequency (Vault only) OR Trigger Amount (Fantasy only) */}
                  {step === 1 && form.savingPlan === 'vault' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-2 font-bold text-sm uppercase tracking-wider">
                        <Repeat size={18} />
                        <span>How often should we save?</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {savingTypes.map((t) => (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => update('savingType', t.value)}
                            className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                              form.savingType === t.value
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border bg-card hover:border-primary/30'
                            }`}
                          >
                            <p className="text-sm font-bold text-card-foreground">{t.label}</p>
                            <p className="text-xs text-muted-foreground mt-1 font-semibold">
                              {t.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 1 && form.savingPlan === 'fantasy-savings' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-2 font-bold text-sm uppercase tracking-wider">
                        <Trophy size={18} className="text-emerald-500" />
                        <span>Win Trigger Amount</span>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Amount to save per user team win (₦)
                        </label>
                        <input
                          type="number"
                          value={form.amount}
                          onChange={(e) => update('amount', e.target.value)}
                          placeholder="5000"
                          className="w-full text-sm rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-foreground font-semibold placeholder-muted-foreground/60 focus:outline-none focus:border-primary mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {/* Step 2: Vault Schedule & Debit Time OR Fantasy Review */}
                  {step === 2 && form.savingPlan === 'vault' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary mb-2 font-bold text-sm uppercase tracking-wider">
                        <Calendar size={18} />
                        <span>Set the schedule & debit time</span>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Amount per {form.savingType} debit (₦)
                        </label>
                        <input
                          type="number"
                          value={form.amount}
                          onChange={(e) => update('amount', e.target.value)}
                          placeholder="5000"
                          className="w-full text-sm rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-foreground font-semibold placeholder-muted-foreground/60 focus:outline-none focus:border-primary mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                          Debit time
                        </label>
                        <input
                          type="text"
                          value={form.debitScheduleTime}
                          onChange={(e) => update('debitScheduleTime', e.target.value)}
                          placeholder="10:00 AM"
                          className="w-full text-sm rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-foreground font-semibold placeholder-muted-foreground/60 focus:outline-none focus:border-primary mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {step === 2 && form.savingPlan === 'fantasy-savings' && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-card-foreground text-sm border-b border-border pb-1.5">
                        Review your plan
                      </h3>
                      <div className="rounded-xl bg-muted/50 border border-border/40 p-4 space-y-2.5 text-xs font-semibold">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plan Type</span>
                          <span className="font-bold text-card-foreground capitalize text-emerald-500">
                            Fantasy Savings
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Linked Team</span>
                          <span className="font-bold text-card-foreground flex items-center gap-1.5">
                            {form.teamLogo && (
                              <img src={form.teamLogo} alt="" className="h-5 w-5 object-contain" />
                            )}
                            {form.teamName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goal Title</span>
                          <span className="font-bold text-card-foreground">{form.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target Amount</span>
                          <span className="font-bold text-card-foreground">
                            ₦{Number(form.targetAmount).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Savings per Win</span>
                          <span className="font-bold text-card-foreground">
                            ₦{Number(form.amount).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-2.5">
                        We will automatically save{' '}
                        <strong>₦{Number(form.amount).toLocaleString()}</strong> whenever{' '}
                        <strong>{form.teamName}</strong> wins a Premier League match.
                      </p>

                      {(() => {
                        const est = getFantasyEstimation();
                        if (!est) return null;
                        return (
                          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5 space-y-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-4">
                            <div className="flex items-center justify-between text-foreground">
                              <span>Estimated Wins Needed</span>
                              <span className="font-extrabold">{est.winsNeeded} wins</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                              <span>Estimated Matches / Time</span>
                              <span>
                                ~{est.estWeeks} games (~{est.estMonths}{' '}
                                {est.estMonths === 1 ? 'month' : 'months'})
                              </span>
                            </div>
                            <p className="text-[9px] text-muted-foreground/80 font-medium leading-relaxed pt-1.5 border-t border-emerald-500/10">
                              *Calculated assuming an average of 1 match per week and a competitive
                              50% win rate.
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Step 3: Vault Review */}
                  {step === 3 && form.savingPlan === 'vault' && (
                    <div className="space-y-3">
                      <h3 className="font-bold text-card-foreground text-sm border-b border-border pb-1.5">
                        Review your plan
                      </h3>
                      <div className="rounded-xl bg-muted/50 border border-border/40 p-4 space-y-2.5 text-xs font-semibold">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plan Type</span>
                          <span className="font-bold text-card-foreground capitalize text-primary">
                            Vault Savings
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goal Title</span>
                          <span className="font-bold text-card-foreground">{form.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Target Amount</span>
                          <span className="font-bold text-card-foreground">
                            ₦{Number(form.targetAmount).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Frequency</span>
                          <span className="font-bold text-card-foreground capitalize">
                            {form.savingType}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Debit amount</span>
                          <span className="font-bold text-card-foreground">
                            ₦{Number(form.amount).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Debit time</span>
                          <span className="font-bold text-card-foreground">
                            {form.debitScheduleTime}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-2.5">
                        We will debit <strong>₦{Number(form.amount).toLocaleString()}</strong>{' '}
                        {form.savingType} at <strong>{form.debitScheduleTime}</strong>.
                      </p>

                      {(() => {
                        const est = getVaultEstimation();
                        if (!est) return null;
                        return (
                          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3.5 space-y-1.5 text-xs font-semibold text-primary mt-4">
                            <div className="flex items-center justify-between text-foreground">
                              <span>Estimated Completion Date</span>
                              <span className="font-extrabold">{est.formattedDate}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                              <span>Estimated Save Iterations</span>
                              <span>
                                {est.cycles} cycles ({form.savingType})
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between mt-6">
                <button
                  type="button"
                  onClick={back}
                  className="px-4 py-2 border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-card"
                >
                  <ArrowLeft size={14} /> Back
                </button>
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={next}
                    className={`px-4.5 py-2.5 rounded-xl text-white text-xs font-bold shadow-elevated hover:opacity-95 transition-all cursor-pointer flex items-center gap-1 ${
                      form.savingPlan === 'fantasy-savings' ? 'bg-emerald-500' : 'gradient-primary'
                    }`}
                  >
                    Next <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-elevated hover:opacity-95 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check size={14} /> {isSubmitting ? 'Creating...' : 'Create Plan'}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
