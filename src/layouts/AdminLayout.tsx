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
  BarChart3,
  Palette, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Menu,
  X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SidebarItem = ({ to, icon: Icon, label, active, collapsed }: { to: string, icon: any, label: string, active: boolean, collapsed: boolean, key?: string }) => (
  <Link to={to}>
    <motion.div
      whileHover={{ x: collapsed ? 0 : 4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
        active 
          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5",
        collapsed && "justify-center px-0"
      )}
    >
      <Icon size={20} className={cn("transition-colors shrink-0", active ? "text-[var(--color-primary)]" : "group-hover:text-[var(--text-primary)]")} />
      
      <AnimatePresence>
        {!collapsed && (
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="font-medium tracking-wide whitespace-nowrap overflow-hidden"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {active && !collapsed && (
        <motion.div 
          layoutId="active-pill"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shadow-glow"
        />
      )}

      {collapsed && active && (
        <motion.div 
          layoutId="active-pill-collapsed"
          className="absolute right-0 w-1 h-6 bg-[var(--color-primary)] rounded-l-full shadow-glow"
        />
      )}
    </motion.div>
  </Link>
);

import { useAuth } from '../state/AuthContext';

export const AdminLayout = () => {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/inventory', icon: Boxes, label: 'Inventory' },
    { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/transfers', icon: Truck, label: 'Transfers' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/theme', icon: Palette, label: 'Theme' },
    { to: '/settings/account', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-main)] text-[var(--text-secondary)] selection:bg-[var(--color-primary)]/30">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="admin-sidebar"
      >
        <div className="p-6 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center shadow-glow">
                  <Boxes size={18} className="text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight text-white uppercase">Wholesale</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="btn-ghost"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <SidebarItem 
              key={item.to} 
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={location.pathname === item.to} 
              collapsed={!isSidebarOpen}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border-subtle)]">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[var(--text-secondary)] hover:text-rose-400 hover:bg-rose-400/5 rounded-[var(--radius-lg)] transition-all group"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        isSidebarOpen ? "ml-[280px]" : "ml-[80px]"
      )}>
        {/* Header */}
        <header className="admin-header">
          <div className="search-input-wrapper">
            <Search size={18} className="text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Search anything..." 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[var(--text-muted)]"
            />
          </div>

          <div className="flex items-center gap-6">
            <Link to="/notifications" className="relative p-2 text-[var(--text-secondary)] hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-primary)] rounded-full border-2 border-[var(--bg-main)]" />
            </Link>
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
