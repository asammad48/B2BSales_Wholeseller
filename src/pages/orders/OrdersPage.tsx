import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { CreateOrderItemRequestDto, CurrencyLookupResponseDto, ProductLookupResponseDto, ShopLookupResponseDto } from '../../api/generated/apiClient';
import { ordersRepository, Order } from '../../repositories/ordersRepository';
import { canMarkAsReady, canComplete, canMarkAsUnable, getStatusColor } from '../../utils/orderActions';
import { ShoppingBag, CheckCircle2, PackageCheck, AlertCircle, X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, Input, SearchableSelect, SearchableSelectOption, Button } from '../../components/common/Form';

interface OrderItemDraft {
  id: string;
  productId: string;
  quantity: string;
}

const createOrderItemDraft = (): OrderItemDraft => ({
  id: `order-item-${Math.random().toString(36).slice(2, 11)}`,
  productId: '',
  quantity: '1',
});

const mapProductOptions = (items: ProductLookupResponseDto[]): SearchableSelectOption[] =>
  items
    .filter((item) => item.id && item.name)
    .map((item) => ({
      value: item.id as string,
      label: item.name as string,
      searchText: [item.sku, item.brandName, item.modelName, item.barcode].filter(Boolean).join(' '),
    }));

const mapShopOptions = (items: ShopLookupResponseDto[]): SearchableSelectOption[] =>
  items
    .filter((item) => item.id && item.name)
    .map((item) => ({
      value: item.id as string,
      label: item.name as string,
      searchText: item.code,
    }));

const mapCurrencyOptions = (items: CurrencyLookupResponseDto[]): SearchableSelectOption[] =>
  items
    .filter((item) => item.id && item.name)
    .map((item) => ({
      value: item.id as string,
      label: `${item.name}${item.code ? ` (${item.code})` : ''}`,
      searchText: [item.code, item.symbol].filter(Boolean).join(' '),
    }));

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [isUnableModalOpen, setIsUnableModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [shops, setShops] = useState<ShopLookupResponseDto[]>([]);
  const [products, setProducts] = useState<ProductLookupResponseDto[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyLookupResponseDto[]>([]);
  const [clientId, setClientId] = useState('');
  const [shopId, setShopId] = useState('');
  const [currencyId, setCurrencyId] = useState('');
  const [exchangeRate, setExchangeRate] = useState('1');
  const [notes, setNotes] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItemDraft[]>([createOrderItemDraft()]);

  const productOptions = useMemo(() => mapProductOptions(products), [products]);
  const shopOptions = useMemo(() => mapShopOptions(shops), [shops]);
  const currencyOptions = useMemo(() => mapCurrencyOptions(currencies), [currencies]);
  const clientOptions = useMemo<SearchableSelectOption[]>(() => (
    clients.map((client) => ({ value: client.id, label: client.name }))
  ), [clients]);

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

  const resetCreateForm = () => {
    setClientId('');
    setShopId('');
    setCurrencyId('');
    setExchangeRate('1');
    setNotes('');
    setOrderItems([createOrderItemDraft()]);
  };

  const fetchCreateLookups = async () => {
    setLookupLoading(true);
    try {
      const response = await ordersRepository.getCreateOrderLookups();
      setClients(response.clients);
      setShops(response.shops);
      setProducts(response.products);
      setCurrencies(response.currencies);
    } catch (error) {
      alert('Failed to load order lookups');
    } finally {
      setLookupLoading(false);
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

  const updateOrderItem = (itemId: string, updates: Partial<OrderItemDraft>) => {
    setOrderItems((current) => current.map((item) => (
      item.id === itemId ? { ...item, ...updates } : item
    )));
  };

  const addOrderItem = () => {
    setOrderItems((current) => [...current, createOrderItemDraft()]);
  };

  const removeOrderItem = (itemId: string) => {
    setOrderItems((current) => (
      current.length === 1 ? current : current.filter((item) => item.id !== itemId)
    ));
  };

  const handleCreateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedNotes = notes.trim();
    const parsedExchangeRate = Number(exchangeRate);
    const items: CreateOrderItemRequestDto[] = orderItems
      .map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
      }))
      .filter((item) => item.productId && Number.isFinite(item.quantity) && item.quantity > 0);

    if (!clientId) return alert('Client is required');
    if (!shopId) return alert('Shop is required');
    if (!currencyId) return alert('Currency is required');
    if (!Number.isFinite(parsedExchangeRate) || parsedExchangeRate <= 0) return alert('Exchange rate must be greater than 0');
    if (items.length !== orderItems.length) return alert('Every product row must have a product and quantity greater than 0');

    try {
      await ordersRepository.createOrder({
        clientId,
        shopId,
        currencyId,
        exchangeRate: parsedExchangeRate,
        notes: trimmedNotes || undefined,
        items,
      });
      setIsCreateModalOpen(false);
      resetCreateForm();
      fetchOrders();
    } catch (error) {
      alert('Failed to create order');
    }
  };

  const columns = [
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
    { header: 'Total', accessor: (o: Order) => <span className="font-medium">${o.totalAmount.toFixed(2)}</span> },
    {
      header: 'Actions',
      accessor: (o: Order) => (
        <div className="flex items-center gap-2">
          {canMarkAsReady(o.status) && <button onClick={(e) => { e.stopPropagation(); handleReady(o.id); }} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="Mark Ready"><PackageCheck size={16} /></button>}
          {canComplete(o.status) && <button onClick={(e) => { e.stopPropagation(); handleComplete(o.id); }} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors" title="Complete Order"><CheckCircle2 size={16} /></button>}
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
              onClick={() => {
                setIsCreateModalOpen(true);
                resetCreateForm();
                fetchCreateLookups();
              }}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-gray-800"
            >
              <Plus size={16} /> Create Order
            </button>
          }
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SearchToolbar search={search} onSearchChange={setSearch} placeholder="Search by order #, client, or shop..." />

          <DataTable data={orders} columns={columns} loading={loading} />

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
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-xl p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light">Create Order</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              {lookupLoading ? (
                <p className="text-sm text-gray-500">Loading order form data...</p>
              ) : (
                <form onSubmit={handleCreateOrder} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Client">
                      <SearchableSelect name="clientId" required value={clientId} onChange={setClientId} placeholder="Select client" searchPlaceholder="Search clients" options={clientOptions} />
                    </FormField>
                    <FormField label="Shop">
                      <SearchableSelect name="shopId" required value={shopId} onChange={setShopId} placeholder="Select shop" searchPlaceholder="Search shops" options={shopOptions} />
                    </FormField>
                    <FormField label="Currency">
                      <SearchableSelect name="currencyId" required value={currencyId} onChange={setCurrencyId} placeholder="Select currency" searchPlaceholder="Search currencies" options={currencyOptions} />
                    </FormField>
                    <FormField label="Exchange Rate">
                      <Input name="exchangeRate" type="number" min="0.000001" step="0.000001" required value={exchangeRate} onChange={(event) => setExchangeRate(event.target.value)} />
                    </FormField>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Products & Quantity</h3>
                        <p className="text-xs text-gray-400">Add one or more products in a single order.</p>
                      </div>
                      <button type="button" onClick={addOrderItem} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-xs font-medium text-white hover:bg-gray-800">
                        <Plus size={14} /> Add Product
                      </button>
                    </div>

                    <div className="space-y-3">
                      {orderItems.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_160px_44px] gap-3 items-end rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
                          <FormField label={`Product ${index + 1}`}>
                            <SearchableSelect
                              name={`productId-${index}`}
                              required
                              value={item.productId}
                              onChange={(value) => updateOrderItem(item.id, { productId: value })}
                              placeholder="Select product"
                              searchPlaceholder="Search products"
                              options={productOptions}
                            />
                          </FormField>
                          <FormField label="Quantity">
                            <Input
                              name={`quantity-${index}`}
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(event) => updateOrderItem(item.id, { quantity: event.target.value })}
                            />
                          </FormField>
                          <button
                            type="button"
                            onClick={() => removeOrderItem(item.id)}
                            disabled={orderItems.length === 1}
                            className="h-[50px] rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Remove product row"
                          >
                            <Trash2 size={16} className="mx-auto" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <FormField label="Notes">
                    <Input name="notes" placeholder="Optional note" value={notes} onChange={(event) => setNotes(event.target.value)} />
                  </FormField>
                  <Button type="submit">Submit Order</Button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUnableModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsUnableModalOpen(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-[32px] shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-light">Unable to Fulfill</h2>
                  <p className="text-xs text-gray-400 mt-1">Order {selectedOrder.orderNumber}</p>
                </div>
                <button onClick={() => setIsUnableModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              <form onSubmit={handleUnableToFulfill} className="space-y-4">
                <FormField label="Reason for Failure">
                  <Input name="reason" required placeholder="Enter reason..." />
                </FormField>
                <Button type="submit" variant="danger">Mark as Unable</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
