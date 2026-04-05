import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  Users,
  Palette,
  Settings,
  LogOut,
  Bell,
  Search,
  Building2,
  MessageSquareMore,
  Coins,
  Upload,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../state/AuthContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ to, icon: Icon, label, active, collapsed }: { to: string; icon: any; label: string; active: boolean; collapsed: boolean; key?: string }) => (
  <Link to={to} title={collapsed ? label : undefined} aria-label={label}>
    <motion.div
      whileHover={{ x: collapsed ? 0 : 4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative border border-transparent',
        active
          ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-[0_0_20px_rgba(16,185,129,0.15)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 hover:border-white/10',
        collapsed &&
          cn(
            'justify-center px-0 h-14 w-14 mx-auto rounded-2xl',
            active
              ? 'bg-gradient-to-br from-[var(--color-primary)]/30 to-[var(--color-accent)]/25 border-[var(--color-primary)]/35 shadow-[0_12px_24px_-12px_var(--color-primary-glow)]'
              : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08]'
          )
      )}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 shrink-0',
          collapsed &&
            cn(
              'h-10 w-10 rounded-xl',
              active
                ? 'bg-[var(--color-primary)]/20 shadow-[0_8px_20px_-14px_var(--color-primary-glow)]'
                : 'bg-white/[0.06] group-hover:bg-white/[0.11]'
            )
        )}
      >
        <Icon
          size={collapsed ? 23 : 21}
          strokeWidth={collapsed ? 2.6 : 2.25}
          className={cn('transition-colors shrink-0', active ? 'text-[var(--color-primary)]' : 'text-[var(--text-primary)]/90 group-hover:text-[var(--text-primary)]')}
        />
      </span>

      <AnimatePresence>
        {!collapsed && (
          <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-[15px] font-medium tracking-wide whitespace-nowrap overflow-hidden">
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {active && !collapsed && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shadow-glow" />}
      {collapsed && active && <motion.div layoutId="active-pill-collapsed" className="absolute -right-1 w-1.5 h-7 bg-[var(--color-primary)] rounded-l-full shadow-glow" />}
    </motion.div>
  </Link>
);

export const AdminLayout = () => {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/bulk-product-upload', icon: Upload, label: 'Bulk Product Upload' },
    { to: '/inventory', icon: Boxes, label: 'Inventory' },
    { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/clients', icon: Building2, label: 'Clients' },
    { to: '/contact-inquiries', icon: MessageSquareMore, label: 'Inquiries' },
    { to: '/transfers', icon: Truck, label: 'Transfers' },
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/currencies', icon: Coins, label: 'Currencies' },
    { to: '/theme', icon: Palette, label: 'Theme' },
    { to: '/settings/account', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-secondary)] selection:bg-[var(--color-primary)]/30">
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.28, ease: 'easeInOut' }}
        className="admin-sidebar overflow-hidden bg-gradient-to-b from-[var(--bg-sidebar)] to-[color-mix(in_oklab,var(--bg-sidebar),black_6%)]"
      >
        <div className={cn('p-4 pb-3 flex items-center justify-between shrink-0 border-b border-[var(--border-subtle)]/70', !isSidebarOpen && 'justify-center')}>
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-2.5">
                <button
                  onClick={() => setSidebarOpen(!isSidebarOpen)}
                  className="w-9 h-9 bg-[var(--color-primary)] rounded-xl flex items-center justify-center shadow-glow"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <Boxes size={18} className="text-white" />
                </button>
                <span className="font-bold text-lg tracking-tight text-white uppercase">Wholesale</span>
              </motion.div>
            )}
          </AnimatePresence>
          {!isSidebarOpen && (
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="h-12 w-12 inline-flex items-center justify-center rounded-2xl transition-all duration-200 bg-white/[0.06] border border-white/10 text-white hover:bg-white/[0.12] hover:border-white/20"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <Boxes size={20} className="text-[var(--color-primary)]" />
            </button>
          )}
        </div>

        <nav className={cn('min-h-0 flex-1 px-4 py-5 flex flex-col gap-2 overflow-y-auto overscroll-contain custom-scrollbar', !isSidebarOpen && 'px-2 gap-3')}>
          {navItems.map((item) => (
            <SidebarItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)}
              collapsed={!isSidebarOpen}
            />
          ))}
        </nav>

        <div className={cn('p-4 border-t border-[var(--border-subtle)]/70', !isSidebarOpen && 'p-2 pb-4')}>
          <button
            onClick={logout}
            title={!isSidebarOpen ? 'Logout' : undefined}
            aria-label="Logout"
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-400/5 rounded-[var(--radius-lg)] transition-all group border border-transparent',
              !isSidebarOpen && 'h-14 w-14 mx-auto justify-center px-0 rounded-2xl bg-white/[0.03] border-white/5 hover:border-rose-400/30'
            )}
          >
            <LogOut size={!isSidebarOpen ? 24 : 20} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      <main className={cn('flex-1 h-screen overflow-y-auto transition-all duration-300', isSidebarOpen ? 'ml-[280px]' : 'ml-[80px]')}>
        <header className="admin-header">
          <div className="search-input-wrapper">
            <Search size={18} className="text-[var(--text-muted)]" />
            <input type="text" placeholder="Search anything..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[var(--text-muted)]" />
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-[var(--text-secondary)] hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-primary)] rounded-full border-2 border-[var(--bg-main)]" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-[var(--border-subtle)]">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-[var(--text-muted)] capitalize">{user?.role || 'Staff'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-[var(--color-accent)] p-0.5 shadow-lg shadow-[var(--color-primary-glow)]">
                <img
                  src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}&background=random`}
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover border-2 border-[var(--bg-main)]"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="admin-page-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
