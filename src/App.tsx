import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './state/AuthContext';
import { SettingsProvider, useSettings } from './state/SettingsContext';
import { LoginPage } from './pages/auth/LoginPage';
import { isAdminAppAccessible } from './utils/accessControl';
import { LogOut, User as UserIcon, Shield, Package, LayoutDashboard, Box, ShoppingBag, ArrowRightLeft, Users, Bell, BarChart3, Building2, MessageSquareMore, Coins, ReceiptText, Upload } from 'lucide-react';
import { ProductsPage } from './pages/products/ProductsPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import PosCreateOrderPage from './pages/orders/PosCreateOrderPage';
import { TransfersPage } from './pages/transfers/TransfersPage';
import { UsersPage } from './pages/users/UsersPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { ClientsPage } from './pages/clients/ClientsPage';
import { ContactInquiriesPage } from './pages/contactInquiries/ContactInquiriesPage';
import { TenantCurrencyPage } from './pages/currencies/TenantCurrencyPage';
import { BulkProductUploadPage } from './pages/bulkProductUpload/BulkProductUploadPage';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const { settings } = useSettings();
  const [isSidebarOpen, setSidebarOpen] = React.useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Upload, label: 'Bulk Product Upload', path: '/bulk-product-upload' },
    { icon: Box, label: 'Inventory', path: '/inventory' },
    { icon: ShoppingBag, label: 'Orders', path: '/orders' },
    { icon: ReceiptText, label: 'POS', path: '/orders/pos' },
    { icon: Building2, label: 'Clients', path: '/clients' },
    { icon: MessageSquareMore, label: 'Contact Inquiries', path: '/contact-inquiries' },
    { icon: ArrowRightLeft, label: 'Transfers', path: '/transfers' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: Coins, label: 'Currencies', path: '/currencies' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ];

  return (
    <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out overflow-hidden`}>
      <div className={`p-4 flex items-center border-b border-[var(--border-subtle)] shrink-0 ${isSidebarOpen ? 'justify-between gap-3' : 'justify-center'}`}>
        {isSidebarOpen && (
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="brand-gradient w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-[0_6px_18px_var(--color-primary-glow)]"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <Shield size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="font-medium text-gray-900 leading-tight truncate">{settings?.name || 'Mobia2Z'}</h1>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Admin</p>
            </div>
          </div>
        )}

        {!isSidebarOpen && (
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="brand-gradient h-10 w-10 inline-flex items-center justify-center rounded-xl transition-all shrink-0 text-white hover:brightness-110 shadow-[0_6px_18px_var(--color-primary-glow)]"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <Shield size={20} />
          </button>
        )}
      </div>

      <nav className="min-h-0 flex-1 p-4 space-y-1 overflow-y-auto overscroll-contain">
        {navItems.map((item) => {
          const isActive =
            (item.path === '/orders' && location.pathname === '/orders') ||
            (item.path === '/orders/pos' && location.pathname.startsWith('/orders/pos')) ||
            (item.path !== '/orders' && item.path !== '/orders/pos' && location.pathname === item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              title={item.label}
              className={`relative flex items-center rounded-2xl text-sm font-medium transition-all duration-200 ease-in-out ${
                isSidebarOpen
                  ? `gap-3 px-4 py-3 ${isActive ? 'brand-gradient text-white shadow-[0_8px_20px_var(--color-primary-glow)]' : 'text-gray-500 hover:bg-[var(--bg-surface-variant-strong)] hover:text-gray-800'}`
                  : `justify-center h-12 w-12 mx-auto ${
                      isActive
                        ? 'ring-1 ring-[var(--color-primary)]/30 shadow-[0_2px_12px_var(--color-primary-glow)]'
                        : 'text-gray-400 hover:text-[var(--color-primary)] hover:ring-1 hover:ring-[var(--color-primary)]/20 hover:bg-[var(--bg-surface-variant)]'
                    }`
              }`}
              style={
                !isSidebarOpen && isActive
                  ? { background: 'var(--brand-gradient-soft)', color: 'var(--color-gradient-end)' }
                  : undefined
              }
            >
              <item.icon
                size={isSidebarOpen ? 21 : 22}
                strokeWidth={isSidebarOpen ? 2.25 : 2.5}
                className="shrink-0 transition-all"
                style={
                  !isSidebarOpen && isActive
                    ? { filter: 'drop-shadow(0 0 5px var(--color-primary-glow))' }
                    : undefined
                }
              />
              {isSidebarOpen && (
                <span className="truncate text-[15px]">{item.label}</span>
              )}
              {!isSidebarOpen && isActive && (
                <span
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-l-full"
                  style={{
                    background: 'var(--brand-gradient-vertical)',
                    boxShadow: '0 0 10px var(--color-primary-glow)',
                  }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border-subtle)] flex justify-center">
        <button
          onClick={logout}
          className={`flex items-center text-sm font-medium text-gray-400 transition-all rounded-2xl group
            hover:text-red-500 hover:ring-1 hover:ring-red-200 hover:shadow-[0_2px_12px_rgba(239,68,68,0.12)]
            ${isSidebarOpen ? 'w-full gap-3 px-4 py-3 hover:bg-red-50' : 'h-12 w-12 justify-center'}`}
        >
          <LogOut
            size={isSidebarOpen ? 18 : 22}
            strokeWidth={isSidebarOpen ? 2.25 : 2.5}
            className="shrink-0 transition-all group-hover:text-red-500 group-hover:[filter:drop-shadow(0_0_4px_rgba(239,68,68,0.45))]"
          />
          {isSidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-[var(--bg-app)]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-8 py-4 flex items-center justify-end sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-[var(--bg-surface-variant-strong)] rounded-full flex items-center justify-center text-gray-400 border border-[var(--border-strong)]">
              <UserIcon size={20} />
            </div>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
        <div className="w-8 h-8 border-4 border-[var(--border-strong)] border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminAppAccessible(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4">
        <div className="max-w-md w-full bg-[var(--bg-surface)] p-8 rounded-[24px] shadow-sm text-center">
          <Shield className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-light mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">Your account does not have permission to access the admin portal.</p>
          <button onClick={() => (window.location.href = '/login')} className="bg-[var(--color-primary)] text-white px-6 py-2 rounded-xl">Back to Login</button>
        </div>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
          <Route path="/bulk-product-upload" element={<ProtectedRoute><BulkProductUploadPage /></ProtectedRoute>} />
          <Route path="/orders/pos" element={<ProtectedRoute><PosCreateOrderPage /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
          <Route path="/contact-inquiries" element={<ProtectedRoute><ContactInquiriesPage /></ProtectedRoute>} />
          <Route path="/transfers" element={<ProtectedRoute><TransfersPage /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
          <Route path="/currencies" element={<ProtectedRoute><TenantCurrencyPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
