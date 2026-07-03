import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Calendar, Repeat, Target, PenLine } from 'lucide-react';
import type { SavingsPlan as Plan } from '@/types';

const savingTypes = [
  { value: 'daily', label: 'Daily', desc: 'Save every day' },
  { value: 'weekly', label: 'Weekly', desc: 'Save every week' },
  { value: 'monthly', label: 'Monthly', desc: 'Save every month' },
  { value: 'yearly', label: 'Yearly', desc: 'Save every year' },
];

const steps = ['Goal', 'Amount', 'Frequency', 'Schedule', 'Review'];

export default function CreatePlan() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    title: '',
    description: '',
    targetAmount: '',
    amount: '',
    savingType: 'monthly',
    savingDuration: '',
    debitScheduleTime: '10:00 AM',
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const next = () => {
    if (step === 0 && !form.title) {
      toast.error('Please enter a title');
      return;
    }
    if (step === 1 && (!form.targetAmount || Number(form.targetAmount) <= 0)) {
      toast.error('Enter a valid target amount');
      return;
    }
    if (step === 3 && (!form.amount || !form.savingDuration)) {
      toast.error('Please fill all fields');
      return;
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = () => {
    const saved = localStorage.getItem('vb_plans');
    const plans: Plan[] = saved ? JSON.parse(saved) : [];

    const newPlan: Plan = {
      id: `plan-${Date.now()}`,
      title: form.title,
      description: form.description,
      currentBalance: 0,
      targetAmount: Number(form.targetAmount),
      savingType: form.savingType,
      savingDuration: form.savingDuration,
    };

    const updatedPlans = [...plans, newPlan];
    localStorage.setItem('vb_plans', JSON.stringify(updatedPlans));

    toast.success(`Savings plan "${form.title}" created successfully!`);
    navigate('/dashboard/plans');
  };

  const slideVariants = {
    enter: { opacity: 0, x: 30 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -30 },
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-extrabold text-foreground mb-2 tracking-tight">
          Create Savings Plan
        </h1>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  i <= step
                    ? 'gradient-primary text-white shadow-card'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < step ? <Check size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 w-6 rounded transition-colors ${
                    i < step ? 'bg-primary' : 'bg-muted'
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
            {step === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary mb-2 font-bold text-sm uppercase tracking-wider">
                  <PenLine size={18} />
                  <span>What are you saving for?</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                    placeholder="e.g. Vacation Fund"
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
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary mb-2 font-bold text-sm uppercase tracking-wider">
                  <Target size={18} />
                  <span>How much do you want to save?</span>
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
                    className="w-full text-xl font-extrabold rounded-xl border border-border bg-muted/20 px-4 py-3 text-foreground focus:outline-none focus:border-primary mt-1"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
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
                      <p className="text-xs text-muted-foreground mt-1 font-semibold">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary mb-2 font-bold text-sm uppercase tracking-wider">
                  <Calendar size={18} />
                  <span>Set the schedule</span>
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
                    Save until
                  </label>
                  <input
                    type="date"
                    value={form.savingDuration}
                    onChange={(e) => update('savingDuration', e.target.value)}
                    className="w-full text-sm rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-foreground font-semibold focus:outline-none focus:border-primary mt-1"
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

            {step === 4 && (
              <div className="space-y-3">
                <h3 className="font-bold text-card-foreground text-sm border-b border-border pb-1.5">
                  Review your plan
                </h3>
                <div className="rounded-xl bg-muted/50 border border-border/40 p-4 space-y-2.5 text-xs font-semibold">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Goal</span>
                    <span className="font-bold text-card-foreground">{form.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target</span>
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
                    <span className="text-muted-foreground">Until</span>
                    <span className="font-bold text-card-foreground">{form.savingDuration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Debit time</span>
                    <span className="font-bold text-card-foreground">{form.debitScheduleTime}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2.5">
                  We will debit <strong>₦{Number(form.amount).toLocaleString()}</strong>{' '}
                  {form.savingType} until{' '}
                  {form.savingDuration ? new Date(form.savingDuration).toLocaleDateString() : '—'}.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="px-4 py-2 border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-card"
          >
            <ArrowLeft size={14} /> Back
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={next}
              className="px-4.5 py-2.5 rounded-xl gradient-primary text-white text-xs font-bold shadow-elevated hover:opacity-95 transition-all cursor-pointer flex items-center gap-1"
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-elevated hover:opacity-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <Check size={14} /> Create Plan
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
