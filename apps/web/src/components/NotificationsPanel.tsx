import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

interface NotificationsPanelProps {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onMarkAllRead: () => void;
}

export default function NotificationsPanel({
  notifications,
  unreadCount,
  isOpen,
  onToggle,
  onClose,
  onMarkAllRead,
}: NotificationsPanelProps) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground cursor-pointer transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-destructive ring-2 ring-card animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2.5 w-80 rounded-2xl border border-border bg-card shadow-elevated p-4 z-50"
            >
              <div className="flex items-center justify-between border-b border-border pb-2.5 mb-2.5">
                <h4 className="font-bold text-foreground text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl text-xs transition-colors hover:bg-muted/50 relative border border-transparent ${
                      n.unread ? 'bg-primary/5 border-primary/10' : ''
                    }`}
                  >
                    <div className="flex justify-between font-semibold text-foreground mb-0.5">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{n.desc}</p>
                    {n.unread && (
                      <span className="absolute top-3.5 right-2 h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
