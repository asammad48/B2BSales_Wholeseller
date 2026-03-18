import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import ThemeSettingsPage from '../pages/theme/ThemeSettingsPage';
import { motion } from 'framer-motion';
import { Boxes } from 'lucide-react';
import NotFoundPage from '../pages/shared/NotFoundPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { OrdersPage } from '../pages/orders/OrdersPage';
import { TransfersPage } from '../pages/transfers/TransfersPage';
import { NotificationsPage } from '../pages/notifications/NotificationsPage';
import { ProductsPage } from '../pages/products/ProductsPage';

// Placeholder for other pages until they are built
const PagePlaceholder = ({ title }: { title: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
  >
    <div className="admin-toolbar">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-[var(--text-muted)] mt-1">Manage your {title.toLowerCase()} and system settings.</p>
      </div>
      <button className="btn-primary">
        Add New
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="admin-card admin-card-hover p-6">
          <p className="text-[var(--text-muted)] text-sm font-medium uppercase tracking-wider">Total {title}</p>
          <div className="flex items-end justify-between mt-2">
            <h3 className="text-3xl font-bold text-white">1,284</h3>
            <span className="text-[var(--color-primary)] text-sm font-medium bg-[var(--color-primary)]/10 px-2 py-1 rounded-lg">+12.5%</span>
          </div>
        </div>
      ))}
    </div>

    <div className="admin-table-container">
      <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <h3 className="font-semibold text-white">Recent Activity</h3>
        <button className="text-sm text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium">View All</button>
      </div>
      <div className="p-8 flex flex-col items-center justify-center text-[var(--text-muted)] min-h-[300px]">
        <Boxes size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">No data available yet</p>
        <p className="text-sm">Start by adding your first {title.toLowerCase().slice(0, -1)}.</p>
      </div>
    </div>
  </motion.div>
);

import LoginPage from '../pages/public/LoginPage';
import ProductDetailPage from '../pages/public/ProductDetailPage';

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/product/:id" element={<ProductDetailPage />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="inventory" element={<PagePlaceholder title="Inventory" />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="users" element={<PagePlaceholder title="Users" />} />
        <Route path="theme" element={<ThemeSettingsPage />} />
        <Route path="settings/account" element={<PagePlaceholder title="Account Settings" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
