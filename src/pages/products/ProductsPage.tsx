import React, { useState, useEffect } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { productsRepository, Product, CatalogLookups, CreateProductPayload } from '../../repositories/productsRepository';
import { Plus, Package, CheckCircle2, XCircle, X, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, Input, Select, Button } from '../../components/common/Form';
import { PricingMode, QualityType, TrackingType } from '../../api/generated/apiClient';

const trackingOptions: TrackingType[] = ['QuantityBased', 'Serialized'];
const qualityOptions: QualityType[] = ['Original', 'OEM', 'HighCopy', 'Refurbished'];
const pricingOptions: PricingMode[] = ['Direct', 'PercentageBased'];

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lookups, setLookups] = useState<CatalogLookups>({ categories: [], brands: [], models: [], partTypes: [] });
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [pricingProduct, setPricingProduct] = useState<Product | null>(null);

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

  const fetchLookups = async () => {
    setLookupsLoading(true);
    try {
      const response = await productsRepository.getCatalogLookups();
      setLookups(response);
    } catch (error) {
      console.error('Failed to fetch catalog lookups', error);
      alert('Failed to load lookup data');
    } finally {
      setLookupsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  useEffect(() => {
    if (isCreateModalOpen) {
      fetchLookups();
    }
  }, [isCreateModalOpen]);

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const toOptional = (value: FormDataEntryValue | null) => {
      const str = (value as string | null)?.trim();
      return str ? str : undefined;
    };

    const toNumber = (value: FormDataEntryValue | null) => {
      const str = (value as string | null)?.trim();
      return str ? Number(str) : undefined;
    };

    const body: CreateProductPayload = {
      categoryId: formData.get('categoryId') as string,
      brandId: toOptional(formData.get('brandId')),
      modelId: toOptional(formData.get('modelId')),
      partTypeId: toOptional(formData.get('partTypeId')),
      sku: formData.get('sku') as string,
      barcode: toOptional(formData.get('barcode')),
      name: formData.get('name') as string,
      shortDescription: toOptional(formData.get('shortDescription')),
      longDescription: toOptional(formData.get('longDescription')),
      specifications: toOptional(formData.get('specifications')),
      trackingType: formData.get('trackingType') as TrackingType,
      qualityType: formData.get('qualityType') as QualityType,
      defaultBuyingPrice: Number(formData.get('defaultBuyingPrice')),
      defaultSellingPrice: Number(formData.get('defaultSellingPrice')),
      defaultPricingMode: formData.get('defaultPricingMode') as PricingMode,
      defaultMarkupPercentage: toNumber(formData.get('defaultMarkupPercentage')),
      warrantyDays: Number(formData.get('warrantyDays')),
      lowStockThreshold: Number(formData.get('lowStockThreshold')),
      primaryImagePath: toOptional(formData.get('primaryImagePath')),
      primaryImageAltText: toOptional(formData.get('primaryImageAltText')),
    };

    try {
      await productsRepository.createProduct(body);
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
    {
      header: 'Actions',
      accessor: (p: Product) => (
        <button
          onClick={() => setPricingProduct(p)}
          className="px-2 py-1 rounded-lg text-xs bg-blue-50 text-blue-600 hover:bg-blue-100"
        >
          Adjust Pricing
        </button>
      )
    }
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
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-[32px] shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light">Create New Product</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {lookupsLoading ? (
                <p className="text-sm text-gray-500">Loading lookups...</p>
              ) : (
                <form onSubmit={handleCreateProduct} className="grid grid-cols-2 gap-4">
                  <FormField label="Category">
                    <Select name="categoryId" required>
                      <option value="">Select category</option>
                      {lookups.categories.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Part Type">
                    <Select name="partTypeId">
                      <option value="">Select part type (optional)</option>
                      {lookups.partTypes.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Brand">
                    <Select name="brandId">
                      <option value="">Select brand (optional)</option>
                      {lookups.brands.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Model">
                    <Select name="modelId">
                      <option value="">Select model (optional)</option>
                      {lookups.models.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Product Name">
                    <Input name="name" required />
                  </FormField>
                  <FormField label="SKU">
                    <Input name="sku" required />
                  </FormField>

                  <FormField label="Barcode">
                    <Input name="barcode" />
                  </FormField>
                  <FormField label="Tracking Type">
                    <Select name="trackingType" required defaultValue="QuantityBased">
                      {trackingOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Quality Type">
                    <Select name="qualityType" required defaultValue="Original">
                      {qualityOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Pricing Mode">
                    <Select name="defaultPricingMode" required defaultValue="Direct">
                      {pricingOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Buying Price">
                    <Input name="defaultBuyingPrice" type="number" min="0" step="0.01" required />
                  </FormField>
                  <FormField label="Selling Price">
                    <Input name="defaultSellingPrice" type="number" min="0" step="0.01" required />
                  </FormField>

                  <FormField label="Markup %">
                    <Input name="defaultMarkupPercentage" type="number" min="0" step="0.01" />
                  </FormField>
                  <FormField label="Warranty Days">
                    <Input name="warrantyDays" type="number" min="0" required />
                  </FormField>

                  <FormField label="Low Stock Threshold">
                    <Input name="lowStockThreshold" type="number" min="0" required />
                  </FormField>
                  <FormField label="Primary Image Path">
                    <Input name="primaryImagePath" type="url" placeholder="https://..." />
                  </FormField>

                  <FormField label="Primary Image Alt Text">
                    <Input name="primaryImageAltText" />
                  </FormField>

                  <div className="col-span-2">
                    <FormField label="Short Description">
                      <textarea name="shortDescription" className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-gray-200 transition-all min-h-16" />
                    </FormField>
                  </div>

                  <div className="col-span-2">
                    <FormField label="Long Description">
                      <textarea name="longDescription" className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-gray-200 transition-all min-h-24" />
                    </FormField>
                  </div>

                  <div className="col-span-2">
                    <FormField label="Specifications">
                      <textarea name="specifications" className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-gray-200 transition-all min-h-24" />
                    </FormField>
                  </div>

                  <div className="col-span-2 mt-2">
                    <Button type="submit" style={{ backgroundColor: 'var(--primary-color)' }}>
                      Create Product
                    </Button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pricingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPricingProduct(null)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-white rounded-[32px] shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-light">Adjust Pricing</h2>
                  <p className="text-xs text-gray-400 mt-1">{pricingProduct.name}</p>
                </div>
                <button onClick={() => setPricingProduct(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await productsRepository.adjustProductPricing(pricingProduct.id, {
                    buyingPrice: Number(formData.get('buyingPrice')),
                    sellingPrice: Number(formData.get('sellingPrice')),
                    pricingMode: formData.get('pricingMode') as PricingMode,
                    markupPercentage: formData.get('markupPercentage') ? Number(formData.get('markupPercentage')) : undefined,
                    reason: (formData.get('reason') as string) || undefined,
                    updateDefaultPrice: true,
                  });
                  setPricingProduct(null);
                  fetchProducts();
                } catch {
                  alert('Failed to adjust product pricing');
                }
              }} className="space-y-4">
                <FormField label="Buying Price"><Input type="number" step="0.01" name="buyingPrice" min={0} required /></FormField>
                <FormField label="Selling Price"><Input type="number" step="0.01" name="sellingPrice" min={0} required /></FormField>
                <FormField label="Pricing Mode">
                  <Select name="pricingMode" defaultValue="Direct">
                    {pricingOptions.map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                </FormField>
                <FormField label="Markup %"><Input type="number" step="0.01" name="markupPercentage" min={0} /></FormField>
                <FormField label="Reason"><Input name="reason" placeholder="Optional reason" /></FormField>
                <Button type="submit" className="flex items-center justify-center gap-2"><DollarSign size={16} />Save Pricing</Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
