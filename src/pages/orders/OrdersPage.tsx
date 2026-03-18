import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { ordersRepository, Order } from '../../repositories/ordersRepository';
import { canMarkAsReady, canComplete, canMarkAsUnable, getStatusColor } from '../../utils/orderActions';
import { ShoppingBag, CheckCircle2, PackageCheck, AlertCircle, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, Input, Select, Button } from '../../components/common/Form';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  
  const [isUnableModalOpen, setIsUnableModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await ordersRepository.getOrders(page, 10, search);
      setOrders(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch orders', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const handleReady = async (id: string) => {
    try {
      await ordersRepository.ready(id);
      fetchOrders();
    } catch (error) {
      alert('Failed to mark order as ready');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await ordersRepository.complete(id);
      fetchOrders();
    } catch (error) {
      alert('Failed to complete order');
    }
  };

  const handleUnableToFulfill = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    const formData = new FormData(e.currentTarget);
    const reason = formData.get('reason') as string;

    try {
      await ordersRepository.unableToFulfill(selectedOrder.id, reason);
      setIsUnableModalOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      alert('Failed to mark order as unable to fulfill');
    }
  };

  const columns = [
    { 
      header: 'ID', 
      accessor: (o: Order) => <span className="text-[10px] font-mono text-gray-400">{o.id}</span>
    },
    { 
      header: 'Order #', 
      accessor: (o: Order) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            <ShoppingBag size={16} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{o.orderNumber}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">
              {new Date(o.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )
    },
    { 
      header: 'Client', 
      accessor: (o: Order) => (
        <div>
          <p className="font-medium">{o.clientName}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{o.clientId}</p>
        </div>
      )
    },
    { header: 'Shop', accessor: 'shopName' as keyof Order },
    { 
      header: 'Status', 
      accessor: (o: Order) => (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusColor(o.status)}`}>
          {o.status}
        </span>
      )
    },
    { 
      header: 'Total', 
      accessor: (o: Order) => (
        <span className="font-medium">${o.totalAmount.toFixed(2)}</span>
      )
    },
    {
      header: 'Actions',
      accessor: (o: Order) => (
        <div className="flex items-center gap-2">
          {canMarkAsReady(o.status) && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleReady(o.id); }}
              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
              title="Mark Ready"
            >
              <PackageCheck size={16} />
            </button>
          )}
          {canComplete(o.status) && (
            <button 
              onClick={(e) => { e.stopPropagation(); handleComplete(o.id); }}
              className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
              title="Complete Order"
            >
              <CheckCircle2 size={16} />
            </button>
          )}
          {canMarkAsUnable(o.status) && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setSelectedOrder(o);
                setIsUnableModalOpen(true);
              }}
              className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
              title="Unable to Fulfill"
            >
              <AlertCircle size={16} />
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
          title="Orders" 
          description="Manage wholesale orders, track fulfillment status, and process completions."
          actions={
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span>Create Order</span>
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
            placeholder="Search by order #, client, or shop..."
          />
          
          <DataTable 
            data={orders} 
            columns={columns} 
            loading={loading}
          />

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between px-2">
            <p className="text-xs text-gray-400">
              Showing <span className="font-medium text-gray-600">{orders.length}</span> of <span className="font-medium text-gray-600">{total}</span> orders
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
                <h2 className="text-2xl font-light">Create Order</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const clientId = String(formData.get('clientId') || '').trim();
                const shopId = String(formData.get('shopId') || '').trim();
                const productId = String(formData.get('productId') || '').trim();
                const quantity = Number(formData.get('quantity'));
                const notes = String(formData.get('notes') || '').trim();

                if (!clientId || !shopId || !productId || !quantity || quantity <= 0) {
                  alert('Client, shop, product and quantity (> 0) are required.');
                  return;
                }

                try {
                  await ordersRepository.createOrder({
                    clientId,
                    shopId,
                    notes: notes || undefined,
                    items: [{ productId, quantity }],
                  });
                  setIsCreateModalOpen(false);
                  fetchOrders();
                } catch {
                  alert('Failed to create order');
                }
              }} className="space-y-4">
                <FormField label="Client ID">
                  <Input name="clientId" required />
                </FormField>
                <FormField label="Shop ID">
                  <Input name="shopId" required />
                </FormField>
                <FormField label="Product ID">
                  <Input name="productId" required />
                </FormField>
                <FormField label="Quantity">
                  <Input name="quantity" type="number" min={1} required />
                </FormField>
                <FormField label="Notes">
                  <Input name="notes" />
                </FormField>
                <Button type="submit">Create</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unable to Fulfill Modal */}
      <AnimatePresence>
        {isUnableModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUnableModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-light">Unable to Fulfill</h2>
                  <p className="text-xs text-gray-400 mt-1">Order {selectedOrder.orderNumber}</p>
                </div>
                <button onClick={() => setIsUnableModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUnableToFulfill} className="space-y-4">
                <FormField label="Reason for Failure">
                  <Select name="reason" required>
                    <option value="Insufficient Stock">Insufficient Stock</option>
                    <option value="Product Discontinued">Product Discontinued</option>
                    <option value="Shipping Restriction">Shipping Restriction</option>
                    <option value="Other">Other</option>
                  </Select>
                </FormField>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  Confirm Cancellation
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
