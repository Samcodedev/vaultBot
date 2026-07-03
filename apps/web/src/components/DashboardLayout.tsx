import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  PiggyBank,
  History,
  LogOut,
  Menu,
  X,
  Shield,
  PlusCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MOCK_NOTIFICATIONS } from '@/data/dashboard.data';
import ThemeToggle from './ThemeToggle';
import NotificationsPanel from './NotificationsPanel';
import ProfileDropdown from './ProfileDropdown';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Savings Plans', path: '/dashboard/plans', icon: PiggyBank },
    { name: 'Create Plan', path: '/dashboard/create', icon: PlusCircle },
    { name: 'Transactions', path: '/dashboard/transactions', icon: History },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter((n) => n.unread).length;
  const displayName = user?.firstName || 'User';
  const email = user?.email || 'user@vaultbot.com';

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-300">
      {/* Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r border-border transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-elevated">
              <Shield size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              VaultBot
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground lg:hidden cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? 'gradient-primary text-white shadow-elevated'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon
                  size={18}
                  className={`transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                />
                {item.name}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute right-2 h-1.5 w-1.5 rounded-full bg-white"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Info */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3 px-2 py-1 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-white font-bold shadow-card">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-semibold text-destructive hover:bg-destructive hover:text-white transition-all duration-200 cursor-pointer shadow-card"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between px-6 border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-30">
          {/* Left: Mobile Toggle & Page Context */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground lg:hidden cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Overview
              </p>
              <h2 className="text-lg font-bold text-foreground">Dashboard</h2>
            </div>
          </div>

          {/* Right: Theme, Notifications, Profile */}
          <div className="flex items-center gap-3.5">
            <ThemeToggle
              theme={theme}
              onToggle={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            />

            <NotificationsPanel
              notifications={notifications}
              unreadCount={unreadCount}
              isOpen={showNotifications}
              onToggle={() => {
                setShowNotifications((v) => !v);
                setShowProfileMenu(false);
              }}
              onClose={() => setShowNotifications(false)}
              onMarkAllRead={markAllRead}
            />

            <ProfileDropdown
              displayName={displayName}
              email={email}
              isOpen={showProfileMenu}
              onToggle={() => {
                setShowProfileMenu((v) => !v);
                setShowNotifications(false);
              }}
              onClose={() => setShowProfileMenu(false)}
              onLogout={handleLogout}
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
