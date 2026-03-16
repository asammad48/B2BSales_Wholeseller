import React from 'react';
import { Routes, Route, Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './state/AuthContext';
import { SettingsProvider, useSettings } from './state/SettingsContext';
import { LoginPage } from './pages/auth/LoginPage';
import { isAdminAppAccessible, getRolePermissions } from './utils/accessControl';
import { LogOut, User as UserIcon, Shield, Settings, BarChart3, Trash2, Package, LayoutDashboard, Box, ShoppingBag, ArrowRightLeft, Users, Bell } from 'lucide-react';
import { ProductsPage } from './pages/products/ProductsPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { TransfersPage } from './pages/transfers/TransfersPage';
import { UsersPage } from './pages/users/UsersPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const { settings } = useSettings();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Box, label: 'Inventory', path: '/inventory' },
    { icon: ShoppingBag, label: 'Orders', path: '/orders' },
    { icon: ArrowRightLeft, label: 'Transfers', path: '/transfers' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3 border-b border-gray-50">
        <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: 'var(--primary-color)' }}>
          <Shield size={20} />
        </div>
        <div>
          <h1 className="font-medium text-gray-900 leading-tight">{settings?.name || 'Wholesaler'}</h1>
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Admin</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              location.pathname === item.path
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
          <span>Logout</span>
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
        <div className="flex-1">
          {children}
        </div>
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
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-gray-900 text-white px-6 py-2 rounded-xl"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const permissions = user ? getRolePermissions(user.role) : null;

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-light text-gray-900">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Welcome back, {user?.name}. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Total Sales</p>
          <p className="text-3xl font-light text-gray-900">$124,500</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Active Orders</p>
          <p className="text-3xl font-light text-gray-900">42</p>
        </div>
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">New Customers</p>
          <p className="text-3xl font-light text-gray-900">12</p>
        </div>
      </div>

      {/* Role-Aware Actions */}
      <div className="bg-white rounded-[24px] shadow-sm overflow-hidden border border-gray-50">
        <div className="px-8 py-6 border-b border-gray-50">
          <h2 className="text-xl font-light">Operational Controls</h2>
          <p className="text-sm text-gray-400">Manage your wholesale operations based on your role permissions.</p>
        </div>
        
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            disabled={!permissions?.canViewReports}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <BarChart3 className="mb-3 text-gray-600" size={24} />
            <span className="text-sm font-medium">View Reports</span>
          </button>

          <button 
            disabled={!permissions?.canManageUsers}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <UserIcon className="mb-3 text-gray-600" size={24} />
            <span className="text-sm font-medium">Manage Users</span>
          </button>

          <button 
            disabled={!permissions?.canEditSettings}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Settings className="mb-3 text-gray-600" size={24} />
            <span className="text-sm font-medium">System Settings</span>
          </button>

          <button 
            disabled={!permissions?.canDeleteData}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border border-red-50 hover:bg-red-50 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <Trash2 className="mb-3 text-red-400" size={24} />
            <span className="text-sm font-medium text-red-600">Delete Records</span>
          </button>
        </div>
      </div>
    </main>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/products" 
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/inventory" 
            element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/orders" 
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/transfers" 
            element={
              <ProtectedRoute>
                <TransfersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/notifications" 
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;
