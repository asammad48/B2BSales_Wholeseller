import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { inventoryRepository, InventoryItem } from '../../repositories/inventoryRepository';
import { Package, ArrowDownCircle, Settings2, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, Input, Select, Button } from '../../components/common/Form';

export const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  
  // Modal states
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await inventoryRepository.getInventory(page, 10, search);
      setItems(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch inventory', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const columns = [
    { 
      header: 'ID', 
      accessor: (i: InventoryItem) => <span className="text-[10px] font-mono text-gray-400">{i.id}</span>
    },
    { 
      header: 'Product', 
      accessor: (i: InventoryItem) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            <Package size={16} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{i.productName}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{i.sku}</p>
          </div>
        </div>
      )
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
            {isLow && <AlertTriangle size={14} className="text-red-500" />}
          </div>
        );
      }
    },
    { header: 'Reserved', accessor: 'reservedQuantity' as keyof InventoryItem },
    { 
      header: 'Available', 
      accessor: (i: InventoryItem) => (
        <span className="font-medium text-emerald-600">
          {i.quantityOnHand - i.reservedQuantity}
        </span>
      )
    },
    { header: 'Tracking', accessor: 'trackingType' as keyof InventoryItem },
    {
      header: 'Actions',
      accessor: (i: InventoryItem) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItem(i);
              setIsAdjustOpen(true);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title="Adjust Stock"
          >
            <Settings2 size={16} />
          </button>
        </div>
      )
    }
  ];

  const handleStockIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body = {
      productId: formData.get('productId') as string,
      shopId: formData.get('shopId') as string,
      quantity: Number(formData.get('quantity')),
    };

    try {
      await inventoryRepository.stockIn(body);
      setIsStockInOpen(false);
      fetchInventory();
    } catch (error) {
      alert('Failed to process stock in');
    }
  };

  const handleAdjustment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    
    const formData = new FormData(e.currentTarget);
    const body = {
      id: selectedItem.id,
      adjustment: Number(formData.get('adjustment')),
      reason: formData.get('reason') as string,
    };

    try {
      await inventoryRepository.adjust(body);
      setIsAdjustOpen(false);
      setSelectedItem(null);
      fetchInventory();
    } catch (error) {
      alert('Failed to process adjustment');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Inventory" 
          description="Monitor stock levels across all shop locations and manage adjustments."
          actions={
            <button 
              onClick={() => setIsStockInOpen(true)}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <ArrowDownCircle size={18} />
              <span>Stock In</span>
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
            placeholder="Search by product, SKU, brand, model, shop..."
          />
          
          <DataTable 
            data={items} 
            columns={columns} 
            loading={loading}
          />

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between px-2">
            <p className="text-xs text-gray-400">
              Showing <span className="font-medium text-gray-600">{items.length}</span> of <span className="font-medium text-gray-600">{total}</span> records
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

      {/* Stock In Modal */}
      <AnimatePresence>
        {isStockInOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStockInOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[32px] shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light">Stock In</h2>
                <button onClick={() => setIsStockInOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleStockIn} className="space-y-4">
                <FormField label="Product ID">
                  <Input name="productId" required placeholder="e.g. 1" />
                </FormField>
                <FormField label="Shop ID">
                  <Input name="shopId" required placeholder="e.g. s1" />
                </FormField>
                <FormField label="Quantity">
                  <Input name="quantity" type="number" required min="1" placeholder="0" />
                </FormField>
                <Button type="submit" style={{ backgroundColor: 'var(--primary-color)' }}>
                  Process Stock In
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adjustment Modal */}
      <AnimatePresence>
        {isAdjustOpen && selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdjustOpen(false)}
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
                  <h2 className="text-2xl font-light">Stock Adjustment</h2>
                  <p className="text-xs text-gray-400 mt-1">{selectedItem.productName} • {selectedItem.shopName}</p>
                </div>
                <button onClick={() => setIsAdjustOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAdjustment} className="space-y-4">
                <FormField label="Adjustment (+/-)">
                  <Input name="adjustment" type="number" required placeholder="e.g. -5 or 10" />
                </FormField>
                <FormField label="Reason">
                  <Select name="reason" required>
                    <option value="Correction">Correction</option>
                    <option value="Damage">Damage</option>
                    <option value="Loss">Loss</option>
                    <option value="Return">Return</option>
                  </Select>
                </FormField>
                <Button type="submit" style={{ backgroundColor: 'var(--primary-color)' }}>
                  Confirm Adjustment
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
