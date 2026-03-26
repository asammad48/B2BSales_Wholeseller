import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { CreateTransferItemRequest, transfersRepository, Transfer, TransferProductLookup } from '../../repositories/transfersRepository';
import { Truck, ArrowRightLeft, CheckCircle2, Package, X, Plus, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, FormField, Input, MultiSearchableSelect, SearchableSelect, SearchableSelectOption } from '../../components/common/Form';
import { ShopLookupItem } from '../../repositories/shopsRepository';

const mapShopOptions = (items: ShopLookupItem[]): SearchableSelectOption[] =>
  items
    .filter((item) => item.id && item.name)
    .map((item) => ({
      value: item.id,
      label: item.name,
      searchText: item.code,
    }));

const mapProductOptions = (items: TransferProductLookup[]): SearchableSelectOption[] =>
  items
    .filter((item) => item.id && item.name)
    .map((item) => ({
      value: item.id as string,
      label: item.name as string,
      searchText: [
        item.sku,
        item.brandName,
        item.modelName,
        item.barcode,
        item.sourceShopName,
        item.trackingType,
      ]
        .filter(Boolean)
        .join(' '),
    }));

const mapSerializedOptions = (product?: TransferProductLookup | null): SearchableSelectOption[] =>
  (product?.serializedBarcodes || []).map((barcode, index) => ({
    value: barcode,
    label: barcode,
    searchText: `${product?.name || ''} ${product?.sku || ''} serialized ${index + 1}`,
  }));

const isSerializedProduct = (product?: TransferProductLookup | null) =>
  (product?.trackingType || '').toLowerCase() === 'serialized';

export const TransfersPage: React.FC = () => {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [shops, setShops] = useState<ShopLookupItem[]>([]);
  const [products, setProducts] = useState<TransferProductLookup[]>([]);
  const [sourceShopId, setSourceShopId] = useState('');
  const [destinationShopId, setDestinationShopId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [selectedSerializedBarcodes, setSelectedSerializedBarcodes] = useState<string[]>([]);
  const [selectedTransferAction, setSelectedTransferAction] = useState<'dispatch' | 'receive' | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [isProcessingTransferAction, setIsProcessingTransferAction] = useState(false);
  const [transferActionItems, setTransferActionItems] = useState<Array<Transfer['items'][number]>>([]);

  const shopOptions = useMemo(() => mapShopOptions(shops), [shops]);
  const sourceProducts = useMemo(
    () => products.filter((item) => item.sourceShopId === sourceShopId && item.availableQuantity > 0),
    [products, sourceShopId]
  );
  const productOptions = useMemo(() => mapProductOptions(sourceProducts), [sourceProducts]);
  const selectedProduct = useMemo(
    () => sourceProducts.find((item) => item.id === productId) || null,
    [productId, sourceProducts]
  );
  const serializedOptions = useMemo(() => mapSerializedOptions(selectedProduct), [selectedProduct]);
  const selectedProductIsSerialized = isSerializedProduct(selectedProduct);
  const effectiveQuantity = selectedProductIsSerialized ? selectedSerializedBarcodes.length : Number(quantity);

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
    setProductId('');
    setQuantity('1');
    setSelectedSerializedBarcodes([]);
  }, [sourceShopId]);

  useEffect(() => {
    setSelectedSerializedBarcodes([]);

    if (!selectedProductIsSerialized) {
      setQuantity('1');
      return;
    }

    setQuantity(String(selectedSerializedBarcodes.length || 0));
  }, [productId]);

  useEffect(() => {
    if (selectedProductIsSerialized) {
      setQuantity(String(selectedSerializedBarcodes.length));
    }
  }, [selectedProductIsSerialized, selectedSerializedBarcodes]);

  const openTransferActionModal = (transfer: Transfer, action: 'dispatch' | 'receive') => {
    setSelectedTransfer(transfer);
    setSelectedTransferAction(action);
    setTransferActionItems(
      transfer.items.map((item) => ({
        ...item,
        barcodes: item.barcodes || [],
      }))
    );
  };

  const closeTransferActionModal = () => {
    if (isProcessingTransferAction) {
      return;
    }

    setSelectedTransfer(null);
    setSelectedTransferAction(null);
    setTransferActionItems([]);
  };


  const updateTransferActionItemQuantity = (index: number, nextQuantity: number) => {
    setTransferActionItems((prevItems) =>
      prevItems.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, quantity: Number.isFinite(nextQuantity) && nextQuantity > 0 ? nextQuantity : 1 }
          : item
      )
    );
  };

  const updateTransferActionItemBarcodes = (index: number, barcodeInput: string) => {
    const normalizedBarcodes = barcodeInput
      .split(',')
      .map((barcode) => barcode.trim())
      .filter(Boolean);

    setTransferActionItems((prevItems) =>
      prevItems.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, barcodes: normalizedBarcodes }
          : item
      )
    );
  };

  const handleTransferAction = async () => {
    if (!selectedTransfer || !selectedTransferAction) {
      return;
    }

    setIsProcessingTransferAction(true);

    try {
      const processItems: CreateTransferItemRequest[] = transferActionItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        barcodes: item.barcodes || [],
      }));

      if (selectedTransferAction === 'dispatch') {
        await transfersRepository.dispatchTransfer(selectedTransfer.id, processItems);
      } else {
        await transfersRepository.receiveTransfer(selectedTransfer.id, processItems);
      }

      setSelectedTransfer(null);
      setSelectedTransferAction(null);
      setTransferActionItems([]);
      fetchTransfers();
    } catch (error) {
      alert(selectedTransferAction === 'dispatch' ? 'Failed to dispatch transfer' : 'Failed to receive transfer');
    } finally {
      setIsProcessingTransferAction(false);
    }
  };

  const resetCreateForm = () => {
    setSourceShopId('');
    setDestinationShopId('');
    setProductId('');
    setQuantity('1');
    setNotes('');
    setSelectedSerializedBarcodes([]);
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
    const notesValue = notes.trim();

    try {
      if (!sourceShopId || !destinationShopId || !productId) {
        alert('From shop, to shop, and product are required');
        return;
      }

      if (sourceShopId === destinationShopId) {
        alert('Source and destination shops must be different');
        return;
      }

      if (!selectedProduct) {
        alert('Select a valid source product');
        return;
      }

      if (selectedProductIsSerialized) {
        if (!selectedSerializedBarcodes.length) {
          alert('Select at least one serialized unit to transfer');
          return;
        }

        if (selectedSerializedBarcodes.length > selectedProduct.availableQuantity) {
          alert('Selected serialized units exceed available stock');
          return;
        }
      } else if (!Number.isFinite(effectiveQuantity) || effectiveQuantity <= 0) {
        alert('Quantity must be greater than 0');
        return;
      } else if (effectiveQuantity > selectedProduct.availableQuantity) {
        alert(`Only ${selectedProduct.availableQuantity} unit${selectedProduct.availableQuantity === 1 ? '' : 's'} available in the source shop`);
        return;
      }

      await transfersRepository.createTransfer({
        sourceShopId,
        destinationShopId,
        notes: notesValue || undefined,
        items: [{
          productId,
          quantity: effectiveQuantity,
          barcodes: selectedProductIsSerialized ? selectedSerializedBarcodes : undefined,
        }],
      });
      setIsCreateModalOpen(false);
      resetCreateForm();
      fetchTransfers();
    } catch (error) {
      console.error('Failed to create transfer', error);
      alert(error instanceof Error ? error.message : 'Failed to create transfer');
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
              onClick={() => openTransferActionModal(t, 'dispatch')}
              className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
              title="Dispatch"
            >
              <Truck size={16} />
            </button>
          )}
          {t.status === 'Dispatched' && (
            <button
              onClick={() => openTransferActionModal(t, 'receive')}
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
          <div className="fixed inset-0 z-50 overflow-y-auto p-4">
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
              className="relative my-8 mx-auto w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto bg-white rounded-[32px] shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-light">New Transfer</h2>
                  <p className="mt-1 text-sm text-gray-500">Choose the source stock first. Serialized products will ask for specific barcode selections.</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {lookupLoading ? (
                <p className="text-sm text-gray-500">Loading lookups...</p>
              ) : (
                <form onSubmit={handleCreateTransfer} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  </div>

                  <FormField label="Product">
                    <SearchableSelect
                      name="productId"
                      required
                      value={productId}
                      onChange={setProductId}
                      placeholder={sourceShopId ? 'Select product' : 'Select source shop first'}
                      searchPlaceholder="Search products"
                      options={productOptions}
                      disabled={!sourceShopId}
                      noResultsText={sourceShopId ? 'No transferable stock found for this shop' : 'Select source shop first'}
                    />
                  </FormField>

                  {selectedProduct ? (
                    <div className="rounded-3xl border border-gray-100 bg-gray-50/60 p-4 text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium text-gray-900">Available:</span> {selectedProduct.availableQuantity} unit{selectedProduct.availableQuantity === 1 ? '' : 's'} in {selectedProduct.sourceShopName}
                      </p>
                      <p>
                        <span className="font-medium text-gray-900">Tracking:</span> {selectedProduct.trackingType || 'QuantityBased'}
                      </p>
                    </div>
                  ) : null}

                  {selectedProductIsSerialized ? (
                    <div className="space-y-4 rounded-3xl border border-gray-100 bg-gray-50/60 p-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Serialized units to transfer</h3>
                        <p className="mt-1 text-xs text-gray-500">Use the multi-select dropdown to choose every serialized unit. If you pick 2 serialized products, the transfer quantity will automatically become 2.</p>
                      </div>
                      <FormField label="Serialized units">
                        <MultiSearchableSelect
                          values={selectedSerializedBarcodes}
                          onChange={setSelectedSerializedBarcodes}
                          options={serializedOptions}
                          placeholder="Select serialized units"
                          searchPlaceholder="Search barcode or IMEI"
                          noResultsText="No serialized units left to select"
                          emptyStateText="No serialized units selected yet."
                        />
                      </FormField>
                    </div>
                  ) : (
                    <FormField label="Quantity">
                      <Input
                        name="quantity"
                        type="number"
                        required
                        min="1"
                        max={selectedProduct?.availableQuantity || undefined}
                        placeholder="0"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                        disabled={!selectedProduct}
                      />
                    </FormField>
                  )}

                  {selectedProductIsSerialized ? (
                    <FormField label="Transfer Quantity">
                      <Input
                        name="resolvedQuantity"
                        type="number"
                        value={String(selectedSerializedBarcodes.length)}
                        readOnly
                        className="bg-gray-100 text-gray-500"
                      />
                    </FormField>
                  ) : null}

                  <FormField label="Notes">
                    <Input
                      name="notes"
                      placeholder="Optional note"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </FormField>
                  <Button type="submit" style={{ backgroundColor: 'var(--primary-color)' }}>
                    Create Transfer
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {selectedTransfer && selectedTransferAction && (
          <div className="fixed inset-0 z-50 overflow-y-auto p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeTransferActionModal}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative my-8 mx-auto w-full max-w-xl overflow-hidden bg-white rounded-[32px] shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-light">{selectedTransferAction === 'dispatch' ? 'Dispatch Transfer' : 'Receive Transfer'}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Confirm transfer request payload before sending to API.
                  </p>
                </div>
                <button onClick={closeTransferActionModal} className="text-gray-400 hover:text-gray-600" disabled={isProcessingTransferAction}>
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4 text-sm text-gray-600">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                  <p><span className="font-medium text-gray-900">Transfer ID:</span> {selectedTransfer.id}</p>
                  <p><span className="font-medium text-gray-900">Route:</span> {selectedTransfer.fromShopName} → {selectedTransfer.toShopName}</p>
                  <p><span className="font-medium text-gray-900">Items:</span> {selectedTransfer.items.length}</p>
                </div>

                <div className="space-y-2">
                  {transferActionItems.map((item, index) => (
                    <div key={`${item.productId}-${item.productName}-${index}`} className="rounded-2xl border border-gray-100 p-3 space-y-2">
                      <p className="font-medium text-gray-900">{item.productName || item.productId}</p>
                      <FormField label="Quantity">
                        <Input
                          type="number"
                          min="1"
                          value={String(item.quantity)}
                          onChange={(event) => updateTransferActionItemQuantity(index, Number(event.target.value))}
                        />
                      </FormField>
                      <FormField label="Barcodes (comma separated)">
                        <Input
                          type="text"
                          value={(item.barcodes || []).join(', ')}
                          onChange={(event) => updateTransferActionItemBarcodes(index, event.target.value)}
                          placeholder="barcode1, barcode2"
                        />
                      </FormField>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeTransferActionModal}
                  className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
                  disabled={isProcessingTransferAction}
                >
                  Cancel
                </button>
                <Button type="button" onClick={handleTransferAction} disabled={isProcessingTransferAction} className="w-auto px-6" style={{ backgroundColor: 'var(--primary-color)' }}>
                  {isProcessingTransferAction
                    ? (selectedTransferAction === 'dispatch' ? 'Dispatching...' : 'Receiving...')
                    : (selectedTransferAction === 'dispatch' ? 'Dispatch Transfer' : 'Receive Transfer')}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
