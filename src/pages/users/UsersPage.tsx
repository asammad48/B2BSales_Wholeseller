import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { usersRepository, UserAdmin } from '../../repositories/usersRepository';
import { User as UserIcon, Shield, Mail, Store, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await usersRepository.getUsers(page, 10, search);
      setUsers(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const columns = [
    { 
      header: 'ID', 
      accessor: (u: UserAdmin) => <span className="text-[10px] font-mono text-gray-400">{u.id}</span>
    },
    { 
      header: 'User', 
      accessor: (u: UserAdmin) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            <UserIcon size={16} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{u.fullName}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{u.email}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Roles', 
      accessor: (u: UserAdmin) => (
        <div className="flex flex-wrap gap-1">
          {(u.roleNames ?? []).map((role, roleIndex) => (
            <span key={`${u.id}-${role}-${roleIndex}`} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase tracking-widest">
              {role}
            </span>
          ))}
        </div>
      )
    },
    { 
      header: 'Shop', 
      accessor: (u: UserAdmin) => (
        <div className="flex items-center gap-2 text-gray-600">
          <Store size={14} className="text-gray-400" />
          <span>{u.shopName}</span>
        </div>
      )
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
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="User Management" 
          description="Manage administrative users, staff, and their access permissions across shops."
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SearchToolbar 
            search={search} 
            onSearchChange={setSearch} 
            placeholder="Search by name or email..."
          />
          
          <DataTable 
            data={users} 
            columns={columns} 
            loading={loading}
          />

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between px-2">
            <p className="text-xs text-gray-400">
              Showing <span className="font-medium text-gray-600">{users.length}</span> of <span className="font-medium text-gray-600">{total}</span> records
            </p>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 text-xs font-medium bg-white border border-gray-100 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button 
                disabled={page * 10 >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 text-xs font-medium bg-white border border-gray-100 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
