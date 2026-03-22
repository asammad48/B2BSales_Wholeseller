import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  PackageCheck,
  Plus,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FormField, Button } from '../../components/common/Form';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { Order, OrderDetails, ordersRepository } from '../../repositories/ordersRepository';
import { canComplete, canMarkAsReady, canMarkAsUnable, getStatusColor } from '../../utils/orderActions';

const formatMoney = (value: number, currencyCode?: string) => `${currencyCode ? `${currencyCode} ` : '$'}${value.toFixed(2)}`;

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [isUnableModalOpen, setIsUnableModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

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

  const openOrderDetails = async (order: Order) => {
    setDetailsLoading(true);
    setOrderDetails(null);
    try {
      const details = await ordersRepository.getOrderDetails(order.id);
      setOrderDetails(details);
    } catch (error) {
      console.error('Failed to fetch order details', error);
      alert('Failed to fetch order details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleReady = async (id: string) => {
    try {
      await ordersRepository.ready(id);
      await fetchOrders();
      if (orderDetails?.orderId === id) {
        const refreshed = await ordersRepository.getOrderDetails(id);
        setOrderDetails(refreshed);
      }
    } catch (error) {
      alert('Failed to mark order as ready');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await ordersRepository.complete(id);
      await fetchOrders();
      if (orderDetails?.orderId === id) {
        const refreshed = await ordersRepository.getOrderDetails(id);
        setOrderDetails(refreshed);
      }
    } catch (error) {
      alert('Failed to complete order');
    }
  };

  const handleUnableToFulfill = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedOrder) return;

    const formData = new FormData(event.currentTarget);
    const reason = String(formData.get('reason') || '').trim();
    if (!reason) {
      alert('Reason is required');
      return;
    }

    try {
      await ordersRepository.unableToFulfill(selectedOrder.id, reason);
      setIsUnableModalOpen(false);
      setSelectedOrder(null);
      await fetchOrders();
      if (orderDetails?.orderId === selectedOrder.id) {
        const refreshed = await ordersRepository.getOrderDetails(selectedOrder.id);
        setOrderDetails(refreshed);
      }
    } catch (error) {
      alert('Failed to mark order as unable to fulfill');
    }
  };

  const columns = useMemo(() => [
    { header: 'ID', accessor: (o: Order) => <span className="text-[10px] font-mono text-gray-400">{o.id}</span> },
    {
      header: 'Order #',
      accessor: (o: Order) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            <ShoppingBag size={16} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{o.orderNumber}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{new Date(o.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Client',
      accessor: (o: Order) => (
        <div>
          <p className="font-medium">{o.clientName}</p>
          <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{o.clientId}</p>
        </div>
      ),
    },
    { header: 'Shop', accessor: 'shopName' as keyof Order },
    {
      header: 'Status',
      accessor: (o: Order) => <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusColor(o.status)}`}>{o.status}</span>,
    },
    { header: 'Total', accessor: (o: Order) => <span className="font-medium">${o.totalAmount.toFixed(2)}</span> },
    {
      header: 'Actions',
      accessor: (o: Order) => (
        <div className="flex items-center gap-2">
          <button onClick={(event) => { event.stopPropagation(); openOrderDetails(o); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors" title="View Details">
            <Eye size={16} />
          </button>
          {canMarkAsReady(o.status) && <button onClick={(event) => { event.stopPropagation(); handleReady(o.id); }} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Mark Ready"><PackageCheck size={16} /></button>}
          {canComplete(o.status) && <button onClick={(event) => { event.stopPropagation(); handleComplete(o.id); }} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors" title="Complete Order"><CheckCircle2 size={16} /></button>}
          {canMarkAsUnable(o.status) && (
            <button onClick={(event) => { event.stopPropagation(); setSelectedOrder(o); setIsUnableModalOpen(true); }} className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors" title="Unable to Fulfill">
              <AlertCircle size={16} />
            </button>
          )}
        </div>
      ),
    },
  ], [orderDetails]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Orders"
          description="Manage wholesale orders, track fulfillment status, inspect full order details, and launch the POS page for new sales."
          actions={
            <button onClick={() => navigate('/orders/pos')} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-gray-800">
              <Plus size={16} /> Create Order
            </button>
          }
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SearchToolbar search={search} onSearchChange={setSearch} placeholder="Search by order #, client, or shop..." />
          <DataTable data={orders} columns={columns} loading={loading} onRowClick={openOrderDetails} />

          <div className="mt-6 flex items-center justify-between px-2">
            <p className="text-xs text-gray-400">
              Showing <span className="font-medium text-gray-600">{orders.length}</span> of <span className="font-medium text-gray-600">{total}</span> orders
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-4 py-2 text-xs font-medium bg-white border border-gray-100 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">Previous</button>
              <button disabled={page * 10 >= total} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 text-xs font-medium bg-white border border-gray-100 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">Next</button>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isUnableModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUnableModalOpen(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }} className="relative w-full max-w-lg bg-white rounded-[32px] shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-light text-gray-900">Unable to Fulfill</h2>
                  <p className="text-sm text-gray-400">Provide a reason for order {selectedOrder.orderNumber}.</p>
                </div>
                <button onClick={() => setIsUnableModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              <form onSubmit={handleUnableToFulfill} className="space-y-4">
                <FormField label="Reason">
                  <textarea name="reason" required rows={4} className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-gray-200 transition-all resize-none" placeholder="Explain why this order cannot be fulfilled" />
                </FormField>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setIsUnableModalOpen(false)} className="px-5 py-3 rounded-xl bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
                  <Button type="submit" variant="danger" className="!w-auto px-6">Confirm</Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(orderDetails || detailsLoading) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOrderDetails(null)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }} className="relative w-full max-w-5xl bg-white rounded-[32px] shadow-xl p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-light text-gray-900">Order Details</h2>
                  <p className="text-sm text-gray-400">Review the full order, totals, notes, and line items.</p>
                </div>
                <button onClick={() => setOrderDetails(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              {detailsLoading || !orderDetails ? (
                <p className="text-sm text-gray-500">Loading order details...</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="rounded-2xl bg-gray-50 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order</p><p className="mt-2 text-lg font-medium text-gray-900">{orderDetails.orderNumber}</p><p className="text-xs text-gray-400">Created {new Date(orderDetails.createdAt).toLocaleString()}</p></div>
                    <div className="rounded-2xl bg-gray-50 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Client</p><p className="mt-2 text-lg font-medium text-gray-900">{orderDetails.clientName || 'Unknown client'}</p><p className="text-xs text-gray-400">{orderDetails.businessName || orderDetails.clientId}</p></div>
                    <div className="rounded-2xl bg-gray-50 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Shop</p><p className="mt-2 text-lg font-medium text-gray-900">{orderDetails.shopName || 'Unknown shop'}</p><p className="text-xs text-gray-400">{orderDetails.shopId}</p></div>
                    <div className="rounded-2xl bg-gray-50 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</p><p className={`mt-2 inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${getStatusColor(orderDetails.status as Order['status'])}`}>{orderDetails.statusLabel}</p><p className="mt-2 text-xs text-gray-400">Ready: {orderDetails.readyAt ? new Date(orderDetails.readyAt).toLocaleString() : '—'}</p><p className="text-xs text-gray-400">Completed: {orderDetails.completedAt ? new Date(orderDetails.completedAt).toLocaleString() : '—'}</p></div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
                    <div className="rounded-[24px] border border-gray-100 overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Items</h3>
                        <span className="text-xs text-gray-400">{orderDetails.items.length} line items</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-gray-50">
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400">Product</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400">SKU</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400">Quantity</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400">Unit Price</th>
                              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-gray-400">Line Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orderDetails.items.map((item) => (
                              <tr key={item.orderItemId || `${item.productId}-${item.sku}`} className="border-b border-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-700">{item.productName || 'Unnamed product'}</td>
                                <td className="px-6 py-4 text-sm text-gray-500">{item.sku || '—'}</td>
                                <td className="px-6 py-4 text-sm text-gray-700">{item.quantity}</td>
                                <td className="px-6 py-4 text-sm text-gray-700">{formatMoney(item.unitPrice, orderDetails.currencyCode)}</td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatMoney(item.lineTotal, orderDetails.currencyCode)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[24px] border border-gray-100 p-5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Notes</p>
                        <p className="mt-3 text-sm leading-6 text-gray-700 whitespace-pre-wrap">{orderDetails.notes || 'No notes added for this order.'}</p>
                      </div>
                      <div className="rounded-[24px] border border-gray-100 p-5 space-y-3">
                        <div className="flex items-center justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatMoney(orderDetails.subtotal, orderDetails.currencyCode)}</span></div>
                        <div className="flex items-center justify-between text-sm text-gray-600"><span>Discount</span><span>{formatMoney(orderDetails.discountAmount, orderDetails.currencyCode)}</span></div>
                        <div className="flex items-center justify-between text-sm text-gray-600"><span>Tax</span><span>{formatMoney(orderDetails.taxAmount, orderDetails.currencyCode)}</span></div>
                        <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-sm font-semibold text-gray-900"><span>Total</span><span>{formatMoney(orderDetails.totalAmount, orderDetails.currencyCode)}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
