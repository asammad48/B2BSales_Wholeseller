import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { productsRepository, Product } from '../../repositories/productsRepository';
import { Plus, Package, CheckCircle2, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, Input, Select, Button } from '../../components/common/Form';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsRepository.getProducts(page, 10, search);
      setProducts(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body = {
      name: formData.get('name') as string,
      sku: formData.get('sku') as string,
      brandName: formData.get('brandName') as string,
      modelName: formData.get('modelName') as string,
      trackingType: formData.get('trackingType') as any,
      qualityType: formData.get('qualityType') as any,
      isActive: true
    };

    try {
      await productsRepository.productsPOST(body);
      setIsCreateModalOpen(false);
      fetchProducts();
    } catch (error) {
      alert('Failed to create product');
    }
  };

  const columns = [
    { 
      header: 'ID', 
      accessor: (p: Product) => <span className="text-[10px] font-mono text-gray-400">{p.id}</span>
    },
    { 
      header: 'Product', 
      accessor: (p: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            <Package size={16} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{p.name}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{p.sku}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Brand / Model', 
      accessor: (p: Product) => (
        <div>
          <p className="font-medium">{p.brandName}</p>
          <p className="text-xs text-gray-400">{p.modelName}</p>
        </div>
      )
    },
    { header: 'Tracking', accessor: 'trackingType' as keyof Product },
    { header: 'Quality', accessor: 'qualityType' as keyof Product },
    { 
      header: 'Status', 
      accessor: (p: Product) => (
        <div className={`flex items-center gap-1.5 ${p.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
          {p.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          <span className="text-xs font-medium">{p.isActive ? 'Active' : 'Inactive'}</span>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader 
          title="Products" 
          description="Manage your wholesale product catalog and inventory specifications."
          actions={
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <Plus size={18} />
              <span>Create Product</span>
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
            placeholder="Search by name, SKU, brand, model..."
          />
          
          <DataTable 
            data={products} 
            columns={columns} 
            loading={loading}
          />

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between px-2">
            <p className="text-xs text-gray-400">
              Showing <span className="font-medium text-gray-600">{products.length}</span> of <span className="font-medium text-gray-600">{total}</span> products
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

      {/* Create Product Modal */}
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
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light">Create New Product</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FormField label="Product Name">
                    <Input name="name" required placeholder="e.g. iPhone 15 Pro" />
                  </FormField>
                </div>
                <FormField label="SKU">
                  <Input name="sku" required placeholder="e.g. IP15-PRO-128-BLK" />
                </FormField>
                <FormField label="Brand">
                  <Input name="brandName" required placeholder="e.g. Apple" />
                </FormField>
                <FormField label="Model">
                  <Input name="modelName" required placeholder="e.g. 15 Pro" />
                </FormField>
                <FormField label="Tracking Type">
                  <Select name="trackingType" required>
                    <option value="Serialized">Serialized</option>
                    <option value="Non-Serialized">Non-Serialized</option>
                  </Select>
                </FormField>
                <FormField label="Quality Type">
                  <Select name="qualityType" required>
                    <option value="New">New</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Used">Used</option>
                  </Select>
                </FormField>
                <div className="col-span-2 mt-4">
                  <Button type="submit" style={{ backgroundColor: 'var(--primary-color)' }}>
                    Create Product
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
