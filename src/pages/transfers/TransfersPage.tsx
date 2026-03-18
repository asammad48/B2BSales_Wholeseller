import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { transfersRepository, Transfer } from '../../repositories/transfersRepository';
import { shopsRepository, ShopLookupItem } from '../../repositories/shopsRepository';
import { Truck, ArrowRightLeft, CheckCircle2, Package, X, Plus, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, Input, Select, Button } from '../../components/common/Form';

export const TransfersPage: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [shops, setShops] = useState<ShopLookupItem[]>([]);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const response = await transfersRepository.getTransfers(page, 10, search);
      setTransfers(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch transfers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransfers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  useEffect(() => {
    const loadShops = async () => {
      try {
        const data = await shopsRepository.getShopsLookup();
        setShops(data);
      } catch (error) {
        console.error('Failed to fetch shops lookup', error);
      }
    };
    loadShops();
  }, []);

  const handleDispatch = async (id: string) => {
    try {
      await transfersRepository.dispatchTransfer(id);
      fetchTransfers();
    } catch (error) {
      alert('Failed to dispatch transfer');
    }
  };

  const handleReceive = async (id: string) => {
    try {
      await transfersRepository.receiveTransfer(id);
      fetchTransfers();
    } catch (error) {
      alert('Failed to receive transfer');
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body = {
      sourceShopId: formData.get('sourceShopId') as string,
      destinationShopId: formData.get('destinationShopId') as string,
      productId: formData.get('productId') as string,
      quantity: Number(formData.get('quantity'))
    };

    if (body.sourceShopId === body.destinationShopId) {
      alert('Source and destination shops cannot be the same.');
      return;
    }

    try {
      await transfersRepository.createTransfer(body);
      setIsCreateModalOpen(false);
      fetchTransfers();
    } catch (error) {
      alert('Failed to create transfer');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Dispatched': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Received': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const columns = [
    { 
      header: 'ID', 
      accessor: (t: Transfer) => <span className="text-[10px] font-mono text-gray-400">{t.id}</span>
    },
    { 
      header: 'Product', 
      accessor: (t: Transfer) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            <Package size={16} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{t.productName}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Qty: {t.quantity}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Route', 
      accessor: (t: Transfer) => (
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium text-gray-600">{t.fromShopName}</span>
          <ArrowRightLeft size={12} className="text-gray-300" />
          <span className="font-medium text-gray-600">{t.toShopName}</span>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: (t: Transfer) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(t.status)}`}>
          {t.status}
        </span>
      )
    },
    { 
      header: 'Date', 
      accessor: (t: Transfer) => (
        <div className="flex items-center gap-1.5 text-gray-400">
          <Clock size={14} />
          <span className="text-xs">{new Date(t.createdAt).toLocaleDateString()}</span>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: (t: Transfer) => (
        <div className="flex items-center gap-2">
          {t.status === 'Pending' && (
            <button 
              onClick={() => handleDispatch(t.id)}
              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
              title="Dispatch"
            >
              <Truck size={16} />
            </button>
          )}
          {t.status === 'Dispatched' && (
            <button 
              onClick={() => handleReceive(t.id)}
              className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
              title="Receive"
            >
              <CheckCircle2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Stock Transfers" 
          description="Manage inventory movement between different shop locations."
          actions={
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <Plus size={18} />
              <span>New Transfer</span>
            </button>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SearchToolbar 
            search={search} 
            onSearchChange={setSearch} 
            placeholder="Search by product or shop..."
          />
          
          <DataTable 
            data={transfers} 
            columns={columns} 
            loading={loading}
          />

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between px-2">
            <p className="text-xs text-gray-400">
              Showing <span className="font-medium text-gray-600">{transfers.length}</span> of <span className="font-medium text-gray-600">{total}</span> records
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

      {/* Create Transfer Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light">New Transfer</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateTransfer} className="space-y-4">
                <FormField label="From Shop ID">
                  <Select name="sourceShopId" required>
                    <option value="">Select source shop</option>
                    {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                  </Select>
                </FormField>
                <FormField label="To Shop ID">
                  <Select name="destinationShopId" required>
                    <option value="">Select destination shop</option>
                    {shops.map((shop) => <option key={shop.id} value={shop.id}>{shop.name}</option>)}
                  </Select>
                </FormField>
                <FormField label="Product ID">
                  <Input name="productId" required placeholder="e.g. 1" />
                </FormField>
                <FormField label="Quantity">
                  <Input name="quantity" type="number" required min="1" placeholder="0" />
                </FormField>
                <Button type="submit" style={{ backgroundColor: 'var(--primary-color)' }}>
                  Create Transfer
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
