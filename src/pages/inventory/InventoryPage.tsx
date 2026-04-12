import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowDownCircle, Eye, Package, Settings2, X } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { PaginationControls } from '../../components/common/PaginationControls';
import { BarcodeScannerInput } from '../../components/common/BarcodeScannerInput';
import { Button, FormField, Input, SearchableSelect, SearchableSelectOption } from '../../components/common/Form';
import {
  inventoryRepository,
  InventoryItem,
  SerializedInventoryUnit,
} from '../../repositories/inventoryRepository';
import { lookupsRepository } from '../../repositories/lookupsRepository';
import { productsRepository } from '../../repositories/productsRepository';

interface SerializedUnitDraft {
  barcode: string;
  imei1: string;
  imei2: string;
}

const mapInventoryLookupOptions = (
  items: { id?: string; name?: string; sku?: string; brandName?: string | undefined; modelName?: string | undefined; code?: string }[]
): SearchableSelectOption[] =>
  items
    .filter((item) => item.id && item.name)
    .map((item) => ({
      value: item.id as string,
      label: item.name as string,
      searchText: [item.sku, item.brandName, item.modelName, item.code].filter(Boolean).join(' '),
    }));

const createSerializedDrafts = (count: number): SerializedUnitDraft[] =>
  Array.from({ length: Math.max(count, 0) }, () => ({
    barcode: '',
    imei1: '',
    imei2: '',
  }));

const synchronizeSerializedDrafts = (drafts: SerializedUnitDraft[], count: number): SerializedUnitDraft[] => {
  const safeCount = Math.max(count, 0);

  if (drafts.length === safeCount) {
    return drafts;
  }

  if (drafts.length > safeCount) {
    return drafts.slice(0, safeCount);
  }

  return [...drafts, ...createSerializedDrafts(safeCount - drafts.length)];
};

const isSerializedTracking = (trackingType?: string) => trackingType === 'Serialized';

const unitKey = (unit: SerializedInventoryUnit) => [unit.barcode, unit.imei1, unit.imei2].join('|');

const buildSerializedUnitLabel = (item: InventoryItem, unit: SerializedInventoryUnit) => {
  const parts = [
    item.productName,
    unit.imei1 ? `IMEI1: ${unit.imei1}` : undefined,
    unit.imei2 ? `IMEI2: ${unit.imei2}` : undefined,
    unit.barcode ? `Barcode: ${unit.barcode}` : undefined,
  ].filter(Boolean);

  return parts.join(' • ');
};

const SerializedUnitsEditor: React.FC<{
  drafts: SerializedUnitDraft[];
  onChange: (drafts: SerializedUnitDraft[]) => void;
}> = ({ drafts, onChange }) => {
  const updateDraft = (index: number, key: keyof SerializedUnitDraft, value: string) => {
    onChange(
      drafts.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, [key]: value } : draft
      )
    );
  };

  return (
    <div className="space-y-4">
      {drafts.map((draft, index) => (
        <div key={`serialized-unit-${index}`} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-variant)] p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Serialized unit {index + 1}</p>
          </div>
          <FormField label="IMEI 1">
            <Input
              value={draft.imei1}
              onChange={(event) => updateDraft(index, 'imei1', event.target.value)}
              placeholder="Enter IMEI 1"
              required
            />
          </FormField>
          <FormField label="IMEI 2">
            <Input
              value={draft.imei2}
              onChange={(event) => updateDraft(index, 'imei2', event.target.value)}
              placeholder="Enter IMEI 2"
              required
            />
          </FormField>
          <FormField label="Barcode">
            <BarcodeScannerInput
              value={draft.barcode}
              onChange={(value) => updateDraft(index, 'barcode', value)}
              placeholder="Scan or enter barcode"
              required
            />
          </FormField>
        </div>
      ))}
    </div>
  );
};

const InventoryDetailsModal: React.FC<{
  item: InventoryItem;
  onClose: () => void;
}> = ({ item, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-black/20 backdrop-blur-sm"
    />
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] bg-[var(--bg-surface)] p-8 shadow-xl"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light">Serialized units</h2>
          <p className="mt-1 text-sm text-gray-500">{item.productName} • {item.shopName}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
      {item.barcodes.length ? (
        <div className="max-h-full overflow-y-auto rounded-3xl border border-[var(--border-subtle)]">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-variant)]">
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">#</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">IMEI 1</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">IMEI 2</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Barcode</th>
              </tr>
            </thead>
            <tbody>
              {item.barcodes.map((unit, index) => (
                <tr key={`${unitKey(unit)}-${index}`} className="border-b border-[var(--border-subtle)] last:border-b-0">
                  <td className="px-5 py-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-5 py-4 font-mono text-sm text-gray-700">{unit.imei1 || '—'}</td>
                  <td className="px-5 py-4 font-mono text-sm text-gray-700">{unit.imei2 || '—'}</td>
                  <td className="px-5 py-4 font-mono text-sm text-gray-700">{unit.barcode || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface-variant)] p-10 text-center text-sm text-gray-500">
          No serialized unit details are available for this inventory record.
        </div>
      )}
      </div>
    </motion.div>
  </div>
);

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [productOptions, setProductOptions] = useState<SearchableSelectOption[]>([]);
  const [shopOptions, setShopOptions] = useState<SearchableSelectOption[]>([]);
  const [stockInProductId, setStockInProductId] = useState('');
  const [stockInShopId, setStockInShopId] = useState('');
  const [stockInQuantity, setStockInQuantity] = useState('1');
  const [stockInTrackingType, setStockInTrackingType] = useState<string>('QuantityBased');
  const [stockInSerializedUnits, setStockInSerializedUnits] = useState<SerializedUnitDraft[]>([]);
  const [adjustShopId, setAdjustShopId] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [adjustReason, setAdjustReason] = useState('Correction');
  const [adjustSerializedUnits, setAdjustSerializedUnits] = useState<SerializedUnitDraft[]>([]);
  const [selectedRemovalUnitKey, setSelectedRemovalUnitKey] = useState('');
  const [selectedRemovalUnits, setSelectedRemovalUnits] = useState<SerializedInventoryUnit[]>([]);

  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [detailsItem, setDetailsItem] = useState<InventoryItem | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await inventoryRepository.getInventory(page, pageSize, search);
      setItems(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch inventory', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    setLookupLoading(true);
    try {
      const bundle = await lookupsRepository.getBundle();
      setProductOptions(mapInventoryLookupOptions(bundle.products));
      setShopOptions(mapInventoryLookupOptions(bundle.shops));
    } catch (error) {
      console.error('Failed to load inventory lookups', error);
      alert('Failed to load lookup data');
    } finally {
      setLookupLoading(false);
    }
  };

  const resetStockInModal = () => {
    setIsStockInOpen(false);
    setStockInProductId('');
    setStockInShopId('');
    setStockInQuantity('1');
    setStockInTrackingType('QuantityBased');
    setStockInSerializedUnits([]);
  };

  const resetAdjustModal = () => {
    setIsAdjustOpen(false);
    setSelectedItem(null);
    setAdjustShopId('');
    setAdjustQuantity('');
    setAdjustReason('Correction');
    setAdjustSerializedUnits([]);
    setSelectedRemovalUnitKey('');
    setSelectedRemovalUnits([]);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page, pageSize]);

  useEffect(() => {
    if (isStockInOpen || isAdjustOpen) {
      void fetchLookups();
    }
  }, [isStockInOpen, isAdjustOpen]);

  useEffect(() => {
    if (!stockInProductId) {
      setStockInTrackingType('QuantityBased');
      return;
    }

    let isActive = true;

    const loadProduct = async () => {
      try {
        const product = await productsRepository.getProductById(stockInProductId);
        if (isActive) {
          setStockInTrackingType(product.trackingType || 'QuantityBased');
        }
      } catch (error) {
        console.error('Failed to resolve product tracking type', error);
        if (isActive) {
          setStockInTrackingType('QuantityBased');
        }
      }
    };

    void loadProduct();

    return () => {
      isActive = false;
    };
  }, [stockInProductId]);

  useEffect(() => {
    if (!isSerializedTracking(stockInTrackingType)) {
      setStockInSerializedUnits([]);
      return;
    }

    setStockInSerializedUnits((current) => synchronizeSerializedDrafts(current, Number(stockInQuantity || 0)));
  }, [stockInQuantity, stockInTrackingType]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    setAdjustShopId(selectedItem.shopId);
    setAdjustQuantity('');
    setAdjustReason('Correction');
    setAdjustSerializedUnits([]);
    setSelectedRemovalUnitKey('');
    setSelectedRemovalUnits([]);
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItem || !isSerializedTracking(selectedItem.trackingType)) {
      setAdjustSerializedUnits([]);
      setSelectedRemovalUnits([]);
      setSelectedRemovalUnitKey('');
      return;
    }

    const changeValue = Number(adjustQuantity || 0);

    if (changeValue > 0) {
      setAdjustSerializedUnits((current) => synchronizeSerializedDrafts(current, changeValue));
      setSelectedRemovalUnits([]);
      setSelectedRemovalUnitKey('');
      return;
    }

    setAdjustSerializedUnits([]);

    if (changeValue < 0) {
      setSelectedRemovalUnits((current) => current.slice(0, Math.abs(changeValue)));
      return;
    }

    setSelectedRemovalUnits([]);
    setSelectedRemovalUnitKey('');
  }, [adjustQuantity, selectedItem]);

  useEffect(() => {
    const computedTotalPages = Math.max(Math.ceil(total / pageSize), 1);
    if (page > computedTotalPages) {
      setPage(computedTotalPages);
    }
  }, [page, pageSize, total]);

  const reasonOptions = useMemo(() => [
    { value: 'Correction', label: 'Correction' },
    { value: 'Damage', label: 'Damage' },
    { value: 'Loss', label: 'Loss' },
    { value: 'Return', label: 'Return' },
  ], []);

  const removalOptions = useMemo<SearchableSelectOption[]>(() => {
    if (!selectedItem) {
      return [];
    }

    const selectedKeys = new Set(selectedRemovalUnits.map(unitKey));

    return selectedItem.barcodes
      .filter((unit) => !selectedKeys.has(unitKey(unit)))
      .map((unit) => ({
        value: unitKey(unit),
        label: buildSerializedUnitLabel(selectedItem, unit),
        searchText: [selectedItem.productName, unit.imei1, unit.imei2, unit.barcode].filter(Boolean).join(' '),
      }));
  }, [selectedItem, selectedRemovalUnits]);

  const isSelectedItemSerialized = isSerializedTracking(selectedItem?.trackingType);
  const adjustmentValue = Number(adjustQuantity || 0);
  const isSerializedAddition = isSelectedItemSerialized && adjustmentValue > 0;
  const isSerializedRemoval = isSelectedItemSerialized && adjustmentValue < 0;
  const requiredRemovalCount = Math.abs(adjustmentValue);
  const columns = [
    {
      header: 'ID',
      accessor: (i: InventoryItem) => <span className="text-[10px] font-mono text-gray-400">{i.id}</span>,
    },
    {
      header: 'Product',
      accessor: (i: InventoryItem) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-surface-variant-strong)] text-gray-400">
            <Package size={16} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{i.productName}</p>
            <p className="text-[10px] uppercase tracking-tighter text-gray-400">{i.sku}</p>
          </div>
        </div>
      ),
    },
    { header: 'Shop', accessor: 'shopName' as keyof InventoryItem },
    {
      header: 'Stock Level',
      accessor: (i: InventoryItem) => {
        const isLow = i.quantityOnHand <= i.lowStockThreshold;
        return (
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
              {i.quantityOnHand}
            </span>
            {isLow ? <AlertTriangle size={14} className="text-red-500" /> : null}
          </div>
        );
      },
    },
    { header: 'Reserved', accessor: 'reservedQuantity' as keyof InventoryItem },
    {
      header: 'Available',
      accessor: (i: InventoryItem) => <span className="font-medium text-emerald-600">{i.availableQuantity}</span>,
    },
    { header: 'Tracking', accessor: 'trackingType' as keyof InventoryItem },
    {
      header: 'Details',
      accessor: (i: InventoryItem) => (
        isSerializedTracking(i.trackingType) ? (
          <button
            onClick={(event) => {
              event.stopPropagation();
              setDetailsItem(i);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-surface-variant-strong)] px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-[var(--bg-surface-variant-strong)]"
          >
            <Eye size={14} /> View units
          </button>
        ) : <span className="text-xs text-gray-400">—</span>
      ),
    },
    {
      header: 'Actions',
      accessor: (i: InventoryItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(event) => {
              event.stopPropagation();
              setSelectedItem(i);
              setIsAdjustOpen(true);
            }}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-[var(--bg-surface-variant-strong)]"
            title="Adjust Stock"
          >
            <Settings2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  const handleStockIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const quantity = Number(stockInQuantity || 0);
    const isSerializedProduct = isSerializedTracking(stockInTrackingType);

    if (!stockInProductId || !stockInShopId || quantity <= 0) {
      alert('Product, shop, and quantity are required.');
      return;
    }

    if (isSerializedProduct) {
      const hasInvalidUnit = stockInSerializedUnits.some((unit) => !unit.barcode.trim() || !unit.imei1.trim() || !unit.imei2.trim());
      if (hasInvalidUnit || stockInSerializedUnits.length !== quantity) {
        alert('Please enter IMEI 1, IMEI 2, and barcode for every serialized unit.');
        return;
      }
    }

    try {
      await inventoryRepository.stockIn({
        productId: stockInProductId,
        shopId: stockInShopId,
        quantity,
        serializedUnits: isSerializedProduct
          ? stockInSerializedUnits.map((unit) => ({
              imei1: unit.imei1.trim(),
              imei2: unit.imei2.trim(),
              unitBarcode: unit.barcode.trim(),
            }))
          : undefined,
      });
      resetStockInModal();
      void fetchInventory();
    } catch (error) {
      console.error('Failed to process stock in', error);
      alert(error instanceof Error ? error.message : 'Failed to process stock in');
    }
  };

  const handleSelectRemovalUnit = (value: string) => {
    if (!selectedItem) {
      return;
    }

    const matchedUnit = selectedItem.barcodes.find((unit) => unitKey(unit) === value);
    if (!matchedUnit) {
      return;
    }

    setSelectedRemovalUnits((current) => {
      if (current.some((unit) => unitKey(unit) === value)) {
        return current;
      }
      return [...current, matchedUnit];
    });
    setSelectedRemovalUnitKey('');
  };

  const handleAdjustment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedItem) {
      return;
    }

    const quantityChange = Number(adjustQuantity || 0);
    if (!adjustShopId || !quantityChange || !adjustReason) {
      alert('Shop, adjustment, and reason are required.');
      return;
    }

    if (quantityChange < 0 && Math.abs(quantityChange) > selectedItem.availableQuantity) {
      alert(`Only ${selectedItem.availableQuantity} item${selectedItem.availableQuantity === 1 ? '' : 's'} available to remove from ${selectedItem.productName}.`);
      return;
    }

    if (isSelectedItemSerialized && quantityChange > 0) {
      const hasInvalidUnit = adjustSerializedUnits.some((unit) => !unit.barcode.trim() || !unit.imei1.trim() || !unit.imei2.trim());
      if (hasInvalidUnit || adjustSerializedUnits.length !== quantityChange) {
        alert('Please enter IMEI 1, IMEI 2, and barcode for every serialized unit being added.');
        return;
      }
    }

    if (isSelectedItemSerialized && quantityChange < 0 && selectedRemovalUnits.length !== Math.abs(quantityChange)) {
      alert(`Please select ${Math.abs(quantityChange)} serialized product${Math.abs(quantityChange) === 1 ? '' : 's'} to remove.`);
      return;
    }

    try {
      await inventoryRepository.adjust({
        shopId: adjustShopId,
        productId: selectedItem.productId,
        quantityChange,
        reason: adjustReason,
        serializedUnits: isSelectedItemSerialized
          ? quantityChange > 0
            ? adjustSerializedUnits.map((unit) => ({
                imei1: unit.imei1.trim(),
                imei2: unit.imei2.trim(),
                unitBarcode: unit.barcode.trim(),
              }))
            : quantityChange < 0
              ? selectedRemovalUnits.map((unit) => ({
                  imei1: unit.imei1 || undefined,
                  imei2: unit.imei2 || undefined,
                  unitBarcode: unit.barcode || undefined,
                }))
              : undefined
          : undefined,
      });
      resetAdjustModal();
      void fetchInventory();
    } catch (error) {
      console.error('Failed to process adjustment', error);
      alert(error instanceof Error ? error.message : 'Failed to process adjustment');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] p-6">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="Inventory"
          description="Monitor stock levels across all shop locations and manage adjustments."
          actions={
            <button
              onClick={() => setIsStockInOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)]"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <ArrowDownCircle size={18} />
              <span>Stock In</span>
            </button>
          }
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SearchToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search by product, SKU, brand, model, shop..."
          />

          <DataTable data={items} columns={columns} loading={loading} />

          <PaginationControls
            currentPage={page}
            pageSize={pageSize}
            totalItems={total}
            currentCount={items.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {isStockInOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetStockInModal}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] bg-[var(--bg-surface)] p-8 shadow-xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-light">Stock In</h2>
                  <p className="mt-1 text-sm text-gray-500">Use quantity flow for normal items and capture every IMEI/barcode for serialized products.</p>
                </div>
                <button onClick={resetStockInModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {lookupLoading ? (
                <p className="text-sm text-gray-500">Loading lookups...</p>
              ) : (
                <form onSubmit={handleStockIn} className="flex-1 space-y-5 overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Product">
                      <SearchableSelect
                        name="productId"
                        required
                        value={stockInProductId}
                        onChange={setStockInProductId}
                        placeholder="Select product"
                        searchPlaceholder="Search products"
                        options={productOptions}
                      />
                    </FormField>
                    <FormField label="Shop">
                      <SearchableSelect
                        name="shopId"
                        required
                        value={stockInShopId}
                        onChange={setStockInShopId}
                        placeholder="Select shop"
                        searchPlaceholder="Search shops"
                        options={shopOptions}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Quantity">
                      <Input
                        name="quantity"
                        type="number"
                        min="1"
                        required
                        value={stockInQuantity}
                        onChange={(event) => setStockInQuantity(event.target.value)}
                        placeholder="0"
                      />
                    </FormField>
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface-variant)] px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tracking type</p>
                      <p className="mt-2 text-sm font-medium text-gray-900">{stockInTrackingType}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {isSerializedTracking(stockInTrackingType)
                          ? 'Each unit below needs IMEI 1, IMEI 2, and a barcode.'
                          : 'Only quantity is required for this product.'}
                      </p>
                    </div>
                  </div>

                  {isSerializedTracking(stockInTrackingType) ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Serialized units</h3>
                        <p className="mt-1 text-xs text-gray-500">When you add {Number(stockInQuantity || 0)} product{Number(stockInQuantity || 0) === 1 ? '' : 's'}, enter {Number(stockInQuantity || 0)} sets of IMEI 1, IMEI 2, and barcode.</p>
                      </div>
                      <SerializedUnitsEditor drafts={stockInSerializedUnits} onChange={setStockInSerializedUnits} />
                    </div>
                  ) : null}

                  <Button type="submit" style={{ backgroundColor: 'var(--primary-color)' }}>
                    Process Stock In
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isAdjustOpen && selectedItem ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetAdjustModal}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[32px] bg-[var(--bg-surface)] p-8 shadow-xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-light">Stock Adjustment</h2>
                  <p className="mt-1 text-xs text-gray-400">{selectedItem.productName} • {selectedItem.shopName} • {selectedItem.trackingType}</p>
                </div>
                <button onClick={resetAdjustModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {lookupLoading ? (
                <p className="text-sm text-gray-500">Loading lookups...</p>
              ) : (
                <form onSubmit={handleAdjustment} className="flex-1 space-y-5 overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Product">
                      <SearchableSelect
                        name="productId"
                        required
                        value={selectedItem.productId}
                        onChange={() => undefined}
                        placeholder="Select product"
                        searchPlaceholder="Search products"
                        options={productOptions}
                        disabled
                      />
                    </FormField>
                    <FormField label="Shop">
                      <SearchableSelect
                        name="shopId"
                        required
                        value={adjustShopId}
                        onChange={setAdjustShopId}
                        placeholder="Select shop"
                        searchPlaceholder="Search shops"
                        options={shopOptions}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField label="Adjustment (+/-)">
                      <Input
                        name="adjustment"
                        type="number"
                        required
                        value={adjustQuantity}
                        onChange={(event) => setAdjustQuantity(event.target.value)}
                        placeholder="e.g. -1 or 3"
                      />
                    </FormField>
                    <FormField label="Reason">
                      <SearchableSelect
                        name="reason"
                        required
                        value={adjustReason}
                        onChange={setAdjustReason}
                        placeholder="Select reason"
                        searchPlaceholder="Search reasons"
                        options={reasonOptions}
                      />
                    </FormField>
                  </div>

                  {isSerializedAddition ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Serialized units to add</h3>
                        <p className="mt-1 text-xs text-gray-500">You are adding {adjustmentValue} serialized product{adjustmentValue === 1 ? '' : 's'}. Enter IMEI 1, IMEI 2, and barcode for each one.</p>
                      </div>
                      <SerializedUnitsEditor drafts={adjustSerializedUnits} onChange={setAdjustSerializedUnits} />
                    </div>
                  ) : null}

                  {isSerializedRemoval ? (
                    <div className="space-y-4 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface-variant)] p-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Serialized products to remove</h3>
                        <p className="mt-1 text-xs text-gray-500">Select {requiredRemovalCount} unit{requiredRemovalCount === 1 ? '' : 's'} using the searchable dropdown. Search by product name, IMEI 1, IMEI 2, or barcode.</p>
                      </div>
                      <FormField label="Remove unit">
                        <SearchableSelect
                          name="serializedRemoval"
                          value={selectedRemovalUnitKey}
                          onChange={handleSelectRemovalUnit}
                          placeholder="Search product / IMEI / barcode"
                          searchPlaceholder="Search IMEI 1, IMEI 2, barcode, or product"
                          options={removalOptions}
                          noResultsText="No more serialized units available"
                        />
                      </FormField>

                      <div className="space-y-2">
                        {selectedRemovalUnits.length ? (
                          selectedRemovalUnits.map((unit, index) => (
                            <div key={`${unitKey(unit)}-${index}`} className="flex items-start justify-between gap-3 rounded-2xl bg-[var(--bg-surface)] px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{buildSerializedUnitLabel(selectedItem, unit)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedRemovalUnits((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[var(--bg-surface-variant-strong)] hover:text-gray-600"
                                title="Remove selection"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No serialized units selected yet.</p>
                        )}
                      </div>
                    </div>
                  ) : null}

                  <Button type="submit" style={{ backgroundColor: 'var(--primary-color)' }}>
                    Confirm Adjustment
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {detailsItem ? <InventoryDetailsModal item={detailsItem} onClose={() => setDetailsItem(null)} /> : null}
      </AnimatePresence>
    </div>
  );
};
