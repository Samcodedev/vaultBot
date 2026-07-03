import { LogOut, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface ProfileDropdownProps {
  displayName: string;
  email: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
}

export default function ProfileDropdown({
  displayName,
  email,
  isOpen,
  onToggle,
  onClose,
  onLogout,
}: ProfileDropdownProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 p-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground cursor-pointer transition-colors"
      >
        <div className="h-7 w-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
          {displayName.charAt(0)}
        </div>
        <span className="hidden sm:inline text-xs font-bold px-1">{displayName}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-border bg-card shadow-elevated p-2.5 z-50 text-sm font-semibold"
            >
              <div className="px-3 py-2 border-b border-border mb-1.5 text-xs">
                <p className="font-bold text-foreground">Signed in as</p>
                <p className="text-muted-foreground truncate">{email}</p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  toast.success('Profile settings page is a simulated feature.');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground text-left cursor-pointer transition-colors"
              >
                <UserIcon size={16} />
                My Profile
              </button>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive text-left cursor-pointer transition-colors border-t border-border mt-1.5 pt-2"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
