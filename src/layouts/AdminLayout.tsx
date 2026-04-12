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
  <Link to={to}>
    <motion.div
      whileHover={{ x: collapsed ? 0 : 4 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        'flex items-center rounded-2xl transition-all duration-200 group relative',
        collapsed
          ? cn(
              'justify-center h-12 w-12 mx-auto',
              active
                ? 'ring-1 ring-[var(--color-primary)]/30 shadow-[0_0_18px_rgba(16,185,129,0.18)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:ring-1 hover:ring-[var(--color-primary)]/15 hover:shadow-[0_0_10px_rgba(16,185,129,0.08)]'
            )
          : cn(
              'gap-3 px-4 py-3',
              active
                ? 'brand-gradient text-white shadow-[0_10px_22px_var(--color-primary-glow)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-overlay-5)]'
            )
      )}
      style={
        collapsed && active
          ? { background: 'var(--brand-gradient-soft)' }
          : undefined
      }
    >
      <Icon
        size={collapsed ? 22 : 21}
        strokeWidth={collapsed ? 2.5 : 2.25}
        className={cn(
          'transition-all shrink-0',
          active ? (collapsed ? 'text-[var(--color-gradient-start)]' : 'text-white') : 'group-hover:text-[var(--color-primary)]',
          collapsed && active ? '[filter:drop-shadow(0_0_5px_rgba(16,185,129,0.55))]' : ''
        )}
      />

      <AnimatePresence>
        {!collapsed && (
          <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-[15px] font-medium tracking-wide whitespace-nowrap overflow-hidden">
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {active && !collapsed && <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--bg-surface-elevated)] shadow-[0_0_8px_var(--focus-ring)]" />}
      {collapsed && active && (
        <motion.div
          layoutId="active-pill-collapsed"
          className="absolute right-0 w-[3px] h-7 rounded-l-full"
          style={{
            background: 'var(--brand-gradient-vertical)',
            boxShadow: '0 0 12px var(--color-primary-glow)',
          }}
        />
      )}
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
        className="admin-sidebar overflow-hidden"
      >
        <div className="p-4 pb-3 flex items-center justify-between shrink-0">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarOpen(!isSidebarOpen)}
                  className="brand-gradient w-8 h-8 rounded-lg flex items-center justify-center shadow-[0_6px_16px_var(--color-primary-glow)]"
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
              className="brand-gradient h-10 w-10 inline-flex items-center justify-center rounded-lg transition-all text-white hover:brightness-110 shadow-[0_6px_16px_var(--color-primary-glow)]"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <Boxes size={18} className="text-white" />
            </button>
          )}
        </div>

        <nav className="min-h-0 flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto overscroll-contain custom-scrollbar">
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

        <div className="p-4 border-t border-[var(--border-subtle)] flex justify-center">
          <button
            onClick={logout}
            className={cn(
              'flex items-center transition-all duration-200 rounded-2xl text-[var(--text-secondary)] group',
              'hover:text-rose-400 hover:ring-1 hover:ring-rose-400/20 hover:shadow-[0_0_10px_rgba(251,113,133,0.12)]',
              isSidebarOpen ? 'w-full gap-3 px-4 py-3 hover:bg-rose-400/8' : 'h-12 w-12 justify-center'
            )}
          >
            <LogOut size={isSidebarOpen ? 20 : 22} strokeWidth={isSidebarOpen ? 2.25 : 2.5} className="shrink-0 transition-all group-hover:text-rose-400 group-hover:[filter:drop-shadow(0_0_4px_rgba(251,113,133,0.5))]" />
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
              <div className="w-10 h-10 rounded-full p-0.5 shadow-lg shadow-[var(--color-primary-glow)]" style={{ background: 'var(--brand-gradient)' }}>
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
