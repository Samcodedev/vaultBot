import { Bell, CheckCheck, MessageSquare, ArrowDownCircle, Inbox, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppNotification } from '@/lib/api';

interface NotificationsPanelProps {
  notifications: AppNotification[];
  isLoading: boolean;
  unreadCount: number;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onMarkAllRead: () => void;
}

function NotificationIcon({ type }: { type: string }) {
  if (type === 'auto-save') {
    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
        <MessageSquare size={14} className="text-violet-600 dark:text-violet-400" />
      </div>
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
      <ArrowDownCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
    </div>
  );
}

export default function NotificationsPanel({
  notifications,
  isLoading,
  unreadCount,
  isOpen,
  onToggle,
  onClose,
  onMarkAllRead,
}: NotificationsPanelProps) {
  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={onToggle}
        className="relative p-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground cursor-pointer transition-all duration-200 hover:scale-105"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-card"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop with mobile blur */}
            <div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md md:bg-transparent md:backdrop-blur-none"
              onClick={onClose}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed md:absolute top-16 md:top-auto left-0 md:left-auto md:right-0 mt-0 md:mt-3 w-full md:w-[340px] h-fit md:h-auto flex flex-col rounded-none md:rounded-2xl border-x-0 md:border border-y md:border-border bg-card shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
                <div className="flex items-center gap-2">
                  <Bell size={15} className="text-primary" />
                  <h4 className="font-bold text-foreground text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 cursor-pointer transition-colors"
                  >
                    <CheckCheck size={13} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="flex-1 md:flex-none md:max-h-[320px] overflow-y-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                    <Loader2 size={22} className="animate-spin" />
                    <p className="text-xs">Loading activity…</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 text-muted-foreground">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Inbox size={22} />
                    </div>
                    <p className="text-sm font-medium">No activity yet</p>
                    <p className="text-xs text-center px-6">
                      Your deposits and auto-saves will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((n, i) => (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-start gap-4 px-5 py-4 hover:bg-muted/50 transition-colors cursor-default ${
                          n.unread ? 'bg-primary/5' : ''
                        }`}
                      >
                        <NotificationIcon type={n.type} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-xs font-bold text-foreground leading-snug">
                              {n.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                            {n.desc}
                          </p>
                        </div>

                        {n.unread && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-border bg-muted/20 text-center">
                  <p className="text-[11px] text-muted-foreground">
                    Showing your last {notifications.length} activities
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
