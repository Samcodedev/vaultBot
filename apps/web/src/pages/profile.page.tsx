import { useState } from 'react';
import { DashboardLayout } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { nombaApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Landmark,
  Copy,
  Check,
  Loader2,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Account number copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetupVirtualAccount = async () => {
    if (!token || !user) return;
    try {
      setIsSettingUp(true);
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'VaultBot User';

      const res = await nombaApi.createVirtualAccount(fullName, token);
      console.log('Nomba virtual account setup response:', res);
      await refreshUser();

      toast.success('Virtual account created successfully with Nomba!');
    } catch (err: unknown) {
      const error = err as Error;
      console.error(error);
      toast.error(error.message || 'Failed to setup virtual account. Please try again.');
    } finally {
      setIsSettingUp(false);
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const displayName = `${user.firstName} ${user.lastName}`;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Header Banner */}
        <div className="relative h-44 sm:h-52 w-full rounded-3xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-lg border border-white/10">
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          <div className="absolute -bottom-10 left-6 sm:left-10 flex flex-col sm:flex-row sm:items-end gap-4.5">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-card border-4 border-background flex items-center justify-center text-primary font-black text-3xl sm:text-4xl shadow-elevated uppercase relative overflow-hidden group">
              <span className="z-10">
                {user.firstName?.charAt(0)}
                {user.lastName?.charAt(0)}
              </span>
              <div className="absolute inset-0 bg-primary/5" />
            </div>

            <div className="pb-1 sm:pb-3 text-white">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight flex items-center gap-2">
                {displayName}
                <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 text-white px-2 py-0.5 rounded-md backdrop-blur-md">
                  Habitant
                </span>
              </h1>
              <p className="text-xs text-white/80 font-medium font-mono">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="pt-6 grid gap-6 md:grid-cols-3">
          {/* User Profile Card */}
          <div className="md:col-span-1 rounded-2xl border border-border bg-card p-6 shadow-card space-y-6">
            <h3 className="font-extrabold text-foreground text-sm tracking-wide uppercase border-b border-border/40 pb-3">
              Personal Profile
            </h3>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs font-semibold text-foreground border-collapse">
                <tbody className="divide-y divide-border/40">
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="py-3 text-muted-foreground font-bold uppercase tracking-wider pr-4">
                      First Name
                    </td>
                    <td className="py-3 text-foreground font-semibold">{user.firstName}</td>
                  </tr>
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="py-3 text-muted-foreground font-bold uppercase tracking-wider pr-4">
                      Last Name
                    </td>
                    <td className="py-3 text-foreground font-semibold">{user.lastName}</td>
                  </tr>
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="py-3 text-muted-foreground font-bold uppercase tracking-wider pr-4">
                      Email
                    </td>
                    <td
                      className="py-3 text-foreground font-semibold truncate max-w-[160px] block"
                      title={user.email}
                    >
                      {user.email}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="py-3 text-muted-foreground font-bold uppercase tracking-wider pr-4">
                      Phone
                    </td>
                    <td className="py-3 text-foreground font-semibold">
                      {user.phoneNumber || 'Not provided'}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/10 transition-colors">
                    <td className="py-3 text-muted-foreground font-bold uppercase tracking-wider pr-4 font-sans">
                      Joined
                    </td>
                    <td className="py-3 text-foreground font-semibold">
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Virtual Account Card */}
          <div className="md:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-2.5">
                  <Landmark size={20} className="text-primary" />
                  <h3 className="font-bold text-foreground text-base">Virtual Bank Account</h3>
                </div>
                {user.accountNumber ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    <ShieldCheck size={12} />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                    <AlertTriangle size={12} />
                    Pending Setup
                  </span>
                )}
              </div>

              <div className="flex flex-col lg:flex-row items-center gap-6 pt-2">
                {/* CSS DEBIT CARD */}
                <div
                  className={`relative w-full max-w-[320px] aspect-[1.586/1] rounded-2xl p-5 text-white shadow-2xl border transition-all duration-500 select-none overflow-hidden shrink-0 ${
                    user.accountNumber
                      ? 'bg-gradient-to-br from-zinc-900 via-neutral-900 to-zinc-950 border-zinc-800'
                      : 'bg-zinc-800/40 border-zinc-700/30 opacity-70 filter saturate-50'
                  }`}
                >
                  <div className="absolute top-0 right-0 h-44 w-44 rounded-full bg-white/5 blur-3xl" />
                  <div className="absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-primary/10 blur-2xl" />

                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black tracking-widest text-zinc-400 uppercase">
                        Nomba Partner
                      </span>
                      <p className="text-[10px] font-bold text-white/80 leading-none">
                        {user.bankName || 'Nombank MFB'}
                      </p>
                    </div>
                    <Landmark
                      size={20}
                      className={user.accountNumber ? 'text-primary' : 'text-zinc-500'}
                    />
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="w-9 h-7 rounded bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-300 shadow-inner flex items-center justify-center overflow-hidden border border-amber-500/20">
                      <div className="w-full h-full opacity-40 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:6px_6px]" />
                    </div>
                    <Fingerprint size={20} className="text-zinc-500" />
                  </div>

                  <div className="mt-5">
                    {user.accountNumber ? (
                      <p className="text-lg font-black font-mono tracking-widest text-zinc-100 drop-shadow">
                        {user.accountNumber.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
                      </p>
                    ) : (
                      <p className="text-base font-black font-mono tracking-widest text-zinc-500">
                        •••• •••• ••••
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex justify-between items-end">
                    <div className="space-y-0.5 max-w-[200px]">
                      <span className="text-[8px] font-extrabold text-zinc-500 uppercase tracking-wider block">
                        Account Holder
                      </span>
                      <p className="text-xs font-black truncate text-zinc-200 uppercase tracking-wider font-mono">
                        {user.bankAccountName || displayName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-widest ${
                          user.accountNumber
                            ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                            : 'text-zinc-500 bg-zinc-500/10 border-zinc-700/20'
                        }`}
                      >
                        {user.accountNumber ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details / Action Block */}
                <div className="flex-1 space-y-4">
                  {user.accountNumber ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 text-emerald-500 text-xs font-semibold leading-relaxed">
                        <ShieldCheck size={18} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-foreground">Verified Account</p>
                          <p className="text-muted-foreground text-[11px] font-medium leading-relaxed mt-0.5">
                            Your virtual bank account details are active. Send funds to this account
                            number to automatically credit your savings plans.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/30 border border-border rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">
                            Virtual Account No
                          </span>
                          <span className="text-sm font-black text-foreground tracking-wider font-mono">
                            {user.accountNumber}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(user.accountNumber || '')}
                          className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors shadow-sm"
                          title="Copy Account Number"
                        >
                          {copied ? (
                            <Check size={14} className="text-emerald-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-2.5 text-amber-500 text-xs font-semibold leading-relaxed">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-foreground">Activation Required</p>
                          <p className="text-muted-foreground text-[11px] font-medium leading-relaxed mt-0.5">
                            You need a Nomba virtual account to connect triggers, enable automated
                            transfers, and start savings actions.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleSetupVirtualAccount}
                        disabled={isSettingUp}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl gradient-primary text-white font-bold text-xs hover:opacity-90 shadow-elevated cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSettingUp ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Provisioning Account...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            Setup Nomba Account
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
