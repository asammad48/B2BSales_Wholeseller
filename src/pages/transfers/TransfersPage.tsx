import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { ProductLookupResponseDto } from '../../api/generated/apiClient';
import { transfersRepository, Transfer } from '../../repositories/transfersRepository';
import { Truck, ArrowRightLeft, CheckCircle2, Package, X, Plus, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, Input, SearchableSelect, SearchableSelectOption, Button } from '../../components/common/Form';
import { ShopLookupItem } from '../../repositories/shopsRepository';

const mapShopOptions = (items: ShopLookupItem[]): SearchableSelectOption[] =>
  items
    .filter((item) => item.id && item.name)
    .map((item) => ({
      value: item.id,
      label: item.name,
      searchText: item.code,
    }));

const mapProductOptions = (items: ProductLookupResponseDto[]): SearchableSelectOption[] =>
  items
    .filter((item) => item.id && item.name)
    .map((item) => ({
      value: item.id as string,
      label: item.name as string,
      searchText: [item.sku, item.brandName, item.modelName, item.barcode].filter(Boolean).join(' '),
    }));

export const TransfersPage: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [shops, setShops] = useState<ShopLookupItem[]>([]);
  const [products, setProducts] = useState<ProductLookupResponseDto[]>([]);
  const [sourceShopId, setSourceShopId] = useState('');
  const [destinationShopId, setDestinationShopId] = useState('');
  const [productId, setProductId] = useState('');

  const shopOptions = useMemo(() => mapShopOptions(shops), [shops]);
  const productOptions = useMemo(() => mapProductOptions(products), [products]);

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

  const resetCreateForm = () => {
    setSourceShopId('');
    setDestinationShopId('');
    setProductId('');
  };

  const fetchCreateLookups = async () => {
    setLookupLoading(true);
    try {
      const response = await transfersRepository.getCreateTransferLookups();
      setShops(response.shops);
      setProducts(response.products);
    } catch (error) {
      console.error('Failed to fetch transfer lookups', error);
      alert('Failed to load transfer lookups');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCreateTransfer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const quantity = Number(formData.get('quantity'));
    const notesValue = (formData.get('notes') as string | null)?.trim();

    try {
      if (!sourceShopId || !destinationShopId || !productId) {
        alert('From shop, to shop, and product are required');
        return;
      }

      if (sourceShopId === destinationShopId) {
        alert('Source and destination shops must be different');
        return;
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        alert('Quantity must be greater than 0');
        return;
      }

      await transfersRepository.createTransfer({
        sourceShopId,
        destinationShopId,
        notes: notesValue || undefined,
        items: [{ productId, quantity }],
      });
      setIsCreateModalOpen(false);
      resetCreateForm();
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
              onClick={() => {
                setIsCreateModalOpen(true);
                resetCreateForm();
                fetchCreateLookups();
              }}
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

              {lookupLoading ? (
                <p className="text-sm text-gray-500">Loading lookups...</p>
              ) : (
                <form onSubmit={handleCreateTransfer} className="space-y-4">
                  <FormField label="From Shop">
                    <SearchableSelect
                      name="sourceShopId"
                      required
                      value={sourceShopId}
                      onChange={setSourceShopId}
                      placeholder="Select source shop"
                      searchPlaceholder="Search shops"
                      options={shopOptions}
                    />
                  </FormField>
                  <FormField label="To Shop">
                    <SearchableSelect
                      name="destinationShopId"
                      required
                      value={destinationShopId}
                      onChange={setDestinationShopId}
                      placeholder="Select destination shop"
                      searchPlaceholder="Search shops"
                      options={shopOptions}
                    />
                  </FormField>
                  <FormField label="Product">
                    <SearchableSelect
                      name="productId"
                      required
                      value={productId}
                      onChange={setProductId}
                      placeholder="Select product"
                      searchPlaceholder="Search products"
                      options={productOptions}
                    />
                  </FormField>
                  <FormField label="Quantity">
                    <Input name="quantity" type="number" required min="1" placeholder="0" defaultValue="1" />
                  </FormField>
                  <FormField label="Notes">
                    <Input name="notes" placeholder="Optional note" />
                  </FormField>
                  <Button type="submit" style={{ backgroundColor: 'var(--primary-color)' }}>
                    Create Transfer
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
