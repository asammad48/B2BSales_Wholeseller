import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './state/AuthContext';
import { SettingsProvider, useSettings } from './state/SettingsContext';
import { LoginPage } from './pages/auth/LoginPage';
import { isAdminAppAccessible } from './utils/accessControl';
import { LogOut, User as UserIcon, Shield, Package, LayoutDashboard, Box, ShoppingBag, ArrowRightLeft, Users, Bell, BarChart3, Building2, MessageSquareMore, Coins, ReceiptText, Upload, ChevronsLeft, ChevronsRight } from 'lucide-react';
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
    <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0 transition-all duration-300 overflow-hidden`}>
      <div className={`p-4 flex items-center border-b border-gray-50 shrink-0 ${isSidebarOpen ? 'justify-between gap-3' : 'justify-center'}`}>
        {isSidebarOpen && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: 'var(--primary-color)' }}>
              <Shield size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="font-medium text-gray-900 leading-tight truncate">{settings?.name || 'Wholesaler'}</h1>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Admin</p>
            </div>
          </div>
        )}

        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className={`inline-flex items-center justify-center rounded-lg transition-colors shrink-0 ${
            isSidebarOpen
              ? 'h-8 w-8 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              : 'h-10 w-10 bg-gray-900 text-white hover:bg-black'
          }`}
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? <ChevronsLeft size={16} /> : <ChevronsRight size={18} />}
        </button>
      </div>

      <nav className="min-h-0 flex-1 p-4 space-y-1 overflow-y-auto overscroll-contain">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              ((item.path === '/orders' && location.pathname === '/orders') || (item.path === '/orders/pos' && location.pathname.startsWith('/orders/pos')) || (item.path !== '/orders' && item.path !== '/orders/pos' && location.pathname === item.path)) ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
            } ${isSidebarOpen ? '' : 'justify-center px-0 mx-auto h-10 w-10'}`}
            title={item.label}
          >
            <item.icon
              size={isSidebarOpen ? 18 : 28}
              strokeWidth={2.25}
              style={isSidebarOpen ? undefined : { width: 28, height: 28, minWidth: 28, minHeight: 28 }}
            />
            {isSidebarOpen && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <button onClick={logout} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all ${isSidebarOpen ? '' : 'justify-center px-0'}`}>
          <LogOut size={18} />
          {isSidebarOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-end sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border border-gray-200">
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
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5]">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminAppAccessible(user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-[24px] shadow-sm text-center">
          <Shield className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-light mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">Your account does not have permission to access the admin portal.</p>
          <button onClick={() => (window.location.href = '/login')} className="bg-gray-900 text-white px-6 py-2 rounded-xl">Back to Login</button>
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
