import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Plus, Store, User as UserIcon, X, XCircle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { PaginationControls } from '../../components/common/PaginationControls';
import { Button, FormField, Input, SearchableSelect, SearchableSelectOption } from '../../components/common/Form';
import { usersRepository, UserAdmin } from '../../repositories/usersRepository';

const roleOptions: SearchableSelectOption[] = [
  { value: 'Owner', label: 'Owner' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Staff', label: 'Staff' },
];

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shops, setShops] = useState<SearchableSelectOption[]>([]);
  const [languages, setLanguages] = useState<SearchableSelectOption[]>([]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Staff');
  const [shopId, setShopId] = useState('');
  const [preferredLanguageId, setPreferredLanguageId] = useState('');
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setRole('Staff');
    setShopId('');
    setPreferredLanguageId('');
    setIsActive(true);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await usersRepository.getUsers(page, pageSize, search);
      setUsers(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    setLookupLoading(true);
    try {
      const response = await usersRepository.getCreateUserLookups();
      setShops((response.shops || []).map((item) => ({ value: item.id || '', label: item.name || 'Unnamed shop', searchText: item.code })));
      setLanguages((response.languages || []).map((item) => ({ value: item.id || '', label: item.name || 'Unnamed language', searchText: item.code })));
    } catch (error) {
      console.error('Failed to fetch user form lookups', error);
      alert('Failed to load form options');
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page, pageSize]);

  useEffect(() => {
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, pageSize, total]);

  const openCreateModal = async () => {
    setIsCreateModalOpen(true);
    resetForm();
    await fetchLookups();
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await usersRepository.createUser({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        role,
        shopId: shopId || undefined,
        preferredLanguageId: preferredLanguageId || undefined,
        isActive,
      });
      setIsCreateModalOpen(false);
      resetForm();
      await fetchUsers();
    } catch (error) {
      console.error('Failed to create user', error);
      alert('Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(() => [
    {
      header: 'ID',
      accessor: (u: UserAdmin) => <span className="text-[10px] font-mono text-gray-400">{u.id}</span>,
    },
    {
      header: 'User',
      accessor: (u: UserAdmin) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--bg-surface-variant-strong)] rounded-lg flex items-center justify-center text-gray-400">
            <UserIcon size={16} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{u.fullName}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Roles',
      accessor: (u: UserAdmin) => (
        <div className="flex flex-wrap gap-1">
          {(u.roleNames ?? []).map((roleName, roleIndex) => (
            <span key={`${u.id}-${roleName}-${roleIndex}`} className="px-2 py-0.5 bg-[var(--bg-surface-variant-strong)] text-gray-600 rounded text-[10px] font-bold uppercase tracking-widest">
              {roleName}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'Shop',
      accessor: (u: UserAdmin) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Store size={14} className="text-gray-400" />
          <span>{u.shopName}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (u: UserAdmin) => (
        <div className="flex items-center gap-2">
          {u.isActive ? (
            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <CheckCircle2 size={12} />
              <span>Active</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <XCircle size={12} />
              <span>Inactive</span>
            </div>
          )}
        </div>
      ),
    },
  ], []);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="User Management"
          description="Manage administrative users, staff, and their access permissions across shops."
          actions={
            <button onClick={openCreateModal} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-gray-800">
              <Plus size={16} /> Create User
            </button>
          }
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SearchToolbar search={search} onSearchChange={setSearch} placeholder="Search by name or email..." />

          <DataTable data={users} columns={columns} loading={loading} />

          <PaginationControls
            currentPage={page}
            pageSize={pageSize}
            totalItems={total}
            currentCount={users.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }} className="relative w-full max-w-3xl bg-[var(--bg-surface)] rounded-[32px] shadow-xl p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-light text-gray-900">Create User</h2>
                  <p className="text-sm text-gray-400">Use the existing admin workflow to add a new dashboard user.</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              {lookupLoading ? (
                <p className="text-sm text-gray-500">Loading user form data...</p>
              ) : (
                <form onSubmit={handleCreateUser} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Full Name">
                      <Input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Enter full name" />
                    </FormField>
                    <FormField label="Email">
                      <Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
                    </FormField>
                    <FormField label="Phone">
                      <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional phone number" />
                    </FormField>
                    <FormField label="Temporary Password">
                      <Input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Set a temporary password" />
                    </FormField>
                    <FormField label="Role">
                      <SearchableSelect name="role" value={role} onChange={setRole} options={roleOptions} placeholder="Select role" searchPlaceholder="Search roles" required />
                    </FormField>
                    <FormField label="Shop">
                      <SearchableSelect name="shopId" value={shopId} onChange={setShopId} options={shops} placeholder="Assign a shop" searchPlaceholder="Search shops" />
                    </FormField>
                    <FormField label="Preferred Language">
                      <SearchableSelect name="preferredLanguageId" value={preferredLanguageId} onChange={setPreferredLanguageId} options={languages} placeholder="Select language" searchPlaceholder="Search languages" />
                    </FormField>
                    <FormField label="Status">
                      <label className="flex items-center justify-between rounded-xl bg-[var(--bg-surface-variant)] px-4 py-3 text-sm text-gray-700">
                        <span>Active user account</span>
                        <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-300" />
                      </label>
                    </FormField>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-3 rounded-xl bg-[var(--bg-surface-variant-strong)] text-sm font-medium text-gray-700 hover:bg-[var(--bg-surface-variant-strong)]">
                      Cancel
                    </button>
                    <Button type="submit" className="!w-auto px-6" disabled={submitting}>
                      {submitting ? 'Creating...' : 'Create User'}
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
