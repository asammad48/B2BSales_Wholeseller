import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { PaginationControls } from '../../components/common/PaginationControls';
import { productsRepository, Product, CatalogLookups, CreateProductPayload } from '../../repositories/productsRepository';
import { Plus, Package, CheckCircle2, XCircle, X, DollarSign, GripVertical, ImagePlus, Star, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, Input, SearchableSelect, SearchableSelectOption, Button } from '../../components/common/Form';
import { PricingMode, QualityType, TrackingType } from '../../api/generated/apiClient';
import { tenantCurrencyRepository, TenantCurrencySettings } from '../../repositories/tenantCurrencyRepository';
import { useProductPricing } from '../../utils/productPricing';

const trackingOptions: TrackingType[] = ['PorCantidad', 'Serializado'];
const qualityOptions: QualityType[] = ['Original', 'Oem', 'Compatible', 'ServicePack', 'OriginalDesmontaje', 'Deji', 'Desconocido'];
const pricingOptions: PricingMode[] = ['Direct', 'PercentageBased'];

interface ProductImageDraft {
  id: string;
  file: File;
  previewUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

const reorderImages = (images: ProductImageDraft[], sourceIndex: number, destinationIndex: number) => {
  const nextImages = [...images];
  const [moved] = nextImages.splice(sourceIndex, 1);
  nextImages.splice(destinationIndex, 0, moved);
  return nextImages.map((image, index) => ({ ...image, sortOrder: index }));
};

const mapLookupOptions = (items: { id?: string; name?: string; code?: string | undefined; symbol?: string | undefined }[]): SearchableSelectOption[] =>
  items
    .filter((item) => item.id && item.name)
    .map((item) => ({
      value: item.id as string,
      label: item.code ? `${item.name as string} (${item.code})` : (item.name as string),
      searchText: [item.code, item.symbol].filter(Boolean).join(' '),
    }));

const mapEnumOptions = (items: string[]): SearchableSelectOption[] =>
  items.map((item) => ({
    value: item,
    label: item,
  }));

const formatMoney = (value: number, currencyCode?: string) => `${currencyCode || '—'} ${value.toFixed(2)}`;

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lookups, setLookups] = useState<CatalogLookups>({ categories: [], brands: [], models: [], partTypes: [], currencies: [] });
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [currencySettings, setCurrencySettings] = useState<TenantCurrencySettings | null>(null);
  const [currencySettingsLoading, setCurrencySettingsLoading] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImageDraft[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);

  const createPricing = useProductPricing({
    currencies: lookups.currencies,
    exchangeRates: currencySettings?.exchangeRates || [],
    defaultSellingCurrencyId: currencySettings?.defaultSellingCurrencyId,
  });

  const pricingAdjustment = useProductPricing({
    currencies: lookups.currencies,
    exchangeRates: currencySettings?.exchangeRates || [],
    defaultSellingCurrencyId: currencySettings?.defaultSellingCurrencyId,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsRepository.getProducts(page, pageSize, search);
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

  const fetchCurrencySettings = async () => {
    setCurrencySettingsLoading(true);
    try {
      const response = await tenantCurrencyRepository.getTenantCurrencySettings();
      setCurrencySettings(response);
    } catch (error) {
      console.error('Failed to fetch tenant currency settings', error);
    } finally {
      setCurrencySettingsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page, pageSize]);

  useEffect(() => {
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, pageSize, total]);

  useEffect(() => {
    fetchLookups();
    fetchCurrencySettings();
  }, []);

  useEffect(() => {
    if (isCreateModalOpen) {
      setCreateError(null);
      setProductImages([]);
      createPricing.setBaseCurrencyId(currencySettings?.defaultSellingCurrencyId || '');
      createPricing.setBasePrice(0);
      createPricing.setPricingMode('Direct');
      createPricing.setSellingPrice(0);
      createPricing.setMarkupPercentage(0);
    }
  }, [isCreateModalOpen, currencySettings?.defaultSellingCurrencyId]);

  useEffect(() => {
    if (selectedProduct && isPricingModalOpen) {
      pricingAdjustment.setBaseCurrencyId(selectedProduct.baseCurrencyId || currencySettings?.defaultSellingCurrencyId || '');
      pricingAdjustment.setBasePrice(selectedProduct.basePrice || selectedProduct.defaultBuyingPrice || 0);
      pricingAdjustment.setPricingMode(selectedProduct.defaultPricingMode || 'Direct');
      pricingAdjustment.setMarkupPercentage(selectedProduct.defaultMarkupPercentage || 0);
      pricingAdjustment.setSellingPrice(selectedProduct.defaultSellingPrice || 0);
    }
  }, [selectedProduct, isPricingModalOpen, currencySettings?.defaultSellingCurrencyId]);

  const categoryOptions = useMemo(() => mapLookupOptions(lookups.categories), [lookups.categories]);
  const brandOptions = useMemo(() => mapLookupOptions(lookups.brands), [lookups.brands]);
  const modelOptions = useMemo(() => mapLookupOptions(lookups.models), [lookups.models]);
  const partTypeOptions = useMemo(() => mapLookupOptions(lookups.partTypes), [lookups.partTypes]);
  const currencyOptions = useMemo(() => mapLookupOptions(lookups.currencies), [lookups.currencies]);
  const trackingTypeOptions = useMemo(() => mapEnumOptions(trackingOptions), []);
  const qualityTypeOptions = useMemo(() => mapEnumOptions(qualityOptions), []);
  const pricingModeOptions = useMemo(() => mapEnumOptions(pricingOptions), []);

  const resetCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateError(null);
    setProductImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return [];
    });
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []) as File[];
    if (selectedFiles.length === 0) {
      return;
    }

    setProductImages((current) => {
      const hasPrimary = current.some((image) => image.isPrimary);
      const appended = selectedFiles.map((file, index) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${index}`,
        file,
        previewUrl: URL.createObjectURL(file),
        altText: '',
        isPrimary: !hasPrimary && current.length === 0 && index === 0,
        sortOrder: current.length + index,
      }));

      return [...current, ...appended].map((image, index) => ({ ...image, sortOrder: index }));
    });

    event.target.value = '';
    setCreateError(null);
  };

  const updateImage = (imageId: string, updater: (image: ProductImageDraft) => ProductImageDraft) => {
    setProductImages((current) => current.map((image) => (image.id === imageId ? updater(image) : image)));
  };

  const removeImage = (imageId: string) => {
    setProductImages((current) => {
      const imageToRemove = current.find((image) => image.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      const nextImages = current.filter((image) => image.id !== imageId).map((image, index) => ({ ...image, sortOrder: index }));
      if (nextImages.length > 0 && !nextImages.some((image) => image.isPrimary)) {
        nextImages[0] = { ...nextImages[0], isPrimary: true };
      }
      return nextImages;
    });
  };

  const setPrimaryImage = (imageId: string) => {
    setProductImages((current) => current.map((image) => ({ ...image, isPrimary: image.id === imageId })));
    setCreateError(null);
  };

  const validateImages = () => {
    if (productImages.length === 0) {
      return 'At least one product image is required.';
    }

    const primaryCount = productImages.filter((image) => image.isPrimary).length;
    if (primaryCount !== 1) {
      return 'Exactly one product image must be marked as primary.';
    }

    return null;
  };

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const imageError = validateImages();
    if (imageError) {
      setCreateError(imageError);
      return;
    }

    if (!createPricing.baseCurrencyId) {
      alert('Base currency is required');
      return;
    }

    if (createPricing.basePrice <= 0) {
      alert('Base price must be greater than zero');
      return;
    }

    const computedSellingPrice = createPricing.pricingMode === 'PercentageBased'
      ? createPricing.computedSellingPrice
      : createPricing.sellingPrice;

    if (computedSellingPrice < 0) {
      alert('Selling price must be non-negative');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const toOptional = (value: FormDataEntryValue | null) => {
      const str = (value as string | null)?.trim();
      return str ? str : undefined;
    };
    const toRequiredNumber = (value: FormDataEntryValue | null) => Number((value as string) || 0);

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
      defaultBuyingPrice: toRequiredNumber(formData.get('defaultBuyingPrice')),
      baseCurrencyId: createPricing.baseCurrencyId,
      basePrice: createPricing.basePrice,
      pricingMode: createPricing.pricingMode,
      sellingPrice: computedSellingPrice,
      markupPercentage: createPricing.pricingMode === 'PercentageBased' ? createPricing.markupPercentage : 0,
      warrantyDays: toRequiredNumber(formData.get('warrantyDays')),
      lowStockThreshold: toRequiredNumber(formData.get('lowStockThreshold')),
      images: productImages.map((image, index) => ({
        file: image.file,
        altText: image.altText,
        isPrimary: image.isPrimary,
        sortOrder: index,
      })),
    };

    try {
      await productsRepository.createProduct(body);
      resetCreateModal();
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Failed to create product');
    }
  };

  const handleAdjustPricing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const formData = new FormData(e.currentTarget);
    const buyingPrice = Number(formData.get('buyingPrice'));
    const reasonRaw = (formData.get('reason') as string)?.trim();
    const effectiveSellingPrice = pricingAdjustment.pricingMode === 'PercentageBased'
      ? pricingAdjustment.computedSellingPrice
      : pricingAdjustment.sellingPrice;

    if (buyingPrice < 0 || effectiveSellingPrice < 0 || pricingAdjustment.basePrice < 0) {
      alert('Base, buying, and selling prices must be non-negative');
      return;
    }

    try {
      await productsRepository.adjustProductPricing(selectedProduct.id, {
        buyingPrice,
        baseCurrencyId: pricingAdjustment.baseCurrencyId,
        basePrice: pricingAdjustment.basePrice,
        pricingMode: pricingAdjustment.pricingMode,
        sellingPrice: effectiveSellingPrice,
        markupPercentage: pricingAdjustment.pricingMode === 'PercentageBased' ? pricingAdjustment.markupPercentage : undefined,
        reason: reasonRaw || undefined,
        updateDefaultPrice: true,
      });
      setIsPricingModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to adjust pricing');
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
    {
      header: 'Pricing',
      accessor: (p: Product) => (
        <div>
          <p className="font-medium text-gray-900">{formatMoney(p.defaultSellingPrice || 0, currencySettings?.defaultSellingCurrencyCode)}</p>
          <p className="text-xs text-gray-400">Base: {formatMoney(p.basePrice || 0, p.baseCurrencyCode)}</p>
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
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProduct(p);
            setIsPricingModalOpen(true);
          }}
          className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600 transition-colors"
          title="Adjust Pricing"
        >
          <DollarSign size={16} />
        </button>
      )
    }
  ];

  const currencyStatusText = currencySettings?.defaultSellingCurrencyCode
    ? `Default selling currency: ${currencySettings.defaultSellingCurrencyCode}`
    : 'Default selling currency is not configured yet.';

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Products"
          description="Manage your wholesale product catalog with tenant currency-aware pricing in the existing admin flow."
          actions={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchCurrencySettings}
                className="bg-white text-gray-700 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium border border-gray-100 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RefreshCcw size={16} className={currencySettingsLoading ? 'animate-spin' : ''} />
                Refresh rates
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gray-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
                style={{ backgroundColor: 'var(--primary-color)' }}
              >
                <Plus size={18} />
                <span>Create Product</span>
              </button>
            </div>
          }
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-[24px] border border-gray-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-900">Pricing context</p>
            <p className="mt-1 text-sm text-gray-500">{currencyStatusText}</p>
            <p className="mt-1 text-xs text-gray-400">Exchange rates loaded: {currencySettings?.exchangeRates.length || 0}</p>
          </div>

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

          <PaginationControls
            currentPage={page}
            pageSize={pageSize}
            totalItems={total}
            currentCount={products.length}
            itemLabel="products"
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetCreateModal}
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
                <button onClick={resetCreateModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {lookupsLoading || currencySettingsLoading ? (
                <p className="text-sm text-gray-500">Loading pricing and lookup data...</p>
              ) : (
                <form onSubmit={handleCreateProduct} className="grid grid-cols-2 gap-4">
                  <FormField label="Category">
                    <SearchableSelect name="categoryId" required placeholder="Select category" options={categoryOptions} />
                  </FormField>
                  <FormField label="Part Type">
                    <SearchableSelect name="partTypeId" placeholder="Select part type (optional)" options={partTypeOptions} />
                  </FormField>

                  <FormField label="Brand">
                    <SearchableSelect name="brandId" placeholder="Select brand (optional)" options={brandOptions} />
                  </FormField>
                  <FormField label="Model">
                    <SearchableSelect name="modelId" placeholder="Select model (optional)" options={modelOptions} />
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
                    <SearchableSelect name="trackingType" required defaultValue="PorCantidad" placeholder="Select tracking type" searchPlaceholder="Search tracking types" options={trackingTypeOptions} />
                  </FormField>

                  <FormField label="Quality Type">
                    <SearchableSelect name="qualityType" required defaultValue="Original" placeholder="Select quality type" searchPlaceholder="Search quality types" options={qualityTypeOptions} />
                  </FormField>
                  <FormField label="Buying Price">
                    <Input name="defaultBuyingPrice" type="number" min="0" step="0.01" required />
                  </FormField>

                  <div className="col-span-2 rounded-[24px] border border-gray-100 bg-gray-50/60 p-5 space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Selling currency pricing</h3>
                      <p className="mt-1 text-xs text-gray-500">Capture the product base currency and price, then derive the selling price in the tenant default selling currency.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField label="Base Currency">
                        <SearchableSelect
                          name="baseCurrencyId"
                          required
                          value={createPricing.baseCurrencyId}
                          onChange={createPricing.setBaseCurrencyId}
                          placeholder="Select base currency"
                          searchPlaceholder="Search currencies"
                          options={currencyOptions}
                        />
                      </FormField>
                      <FormField label="Base Price">
                        <Input
                          name="basePrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={createPricing.basePrice}
                          onChange={(event) => createPricing.setBasePrice(Number(event.target.value || 0))}
                          required
                        />
                      </FormField>

                      <FormField label="Default Selling Currency">
                        <Input value={createPricing.defaultSellingCurrency?.code || currencySettings?.defaultSellingCurrencyCode || ''} readOnly disabled />
                      </FormField>
                      <FormField label="Converted Amount">
                        <Input value={createPricing.convertedAmount.toFixed(2)} readOnly disabled />
                      </FormField>

                      <FormField label="Pricing Mode">
                        <SearchableSelect
                          name="pricingMode"
                          required
                          value={createPricing.pricingMode}
                          onChange={(value) => createPricing.setPricingMode(value as PricingMode)}
                          placeholder="Select pricing mode"
                          searchPlaceholder="Search pricing modes"
                          options={pricingModeOptions}
                        />
                      </FormField>
                      <FormField label="Selling Price">
                        <Input
                          name="sellingPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={(createPricing.pricingMode === 'PercentageBased' ? createPricing.computedSellingPrice : createPricing.sellingPrice).toFixed(2)}
                          onChange={(event) => createPricing.setSellingPrice(Number(event.target.value || 0))}
                          disabled={createPricing.pricingMode === 'PercentageBased'}
                          required
                        />
                      </FormField>

                      {createPricing.pricingMode === 'PercentageBased' && (
                        <FormField label="Markup %">
                          <Input
                            name="markupPercentage"
                            type="number"
                            min="0"
                            step="0.01"
                            value={createPricing.markupPercentage}
                            onChange={(event) => createPricing.setMarkupPercentage(Number(event.target.value || 0))}
                          />
                        </FormField>
                      )}
                    </div>

                    {createPricing.conversionMissing && (
                      <p className="text-xs text-amber-600">No tenant exchange rate exists for the selected base currency and the default selling currency yet.</p>
                    )}
                  </div>

                  <FormField label="Warranty Days">
                    <Input name="warrantyDays" type="number" min="0" required />
                  </FormField>

                  <FormField label="Low Stock Threshold">
                    <Input name="lowStockThreshold" type="number" min="0" required />
                  </FormField>

                  <div className="col-span-2">
                    <FormField label="Product Images" error={createError || undefined}>
                      <div className="space-y-4">
                        <label className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-4 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors">
                          <ImagePlus size={18} />
                          <span>Add product images</span>
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelection} />
                        </label>

                        {productImages.length > 0 && (
                          <div className="space-y-3">
                            {productImages.map((image, index) => (
                              <div
                                key={image.id}
                                draggable
                                onDragStart={() => setDraggedImageId(image.id)}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={() => {
                                  if (!draggedImageId || draggedImageId === image.id) return;
                                  const sourceIndex = productImages.findIndex((item) => item.id === draggedImageId);
                                  const destinationIndex = productImages.findIndex((item) => item.id === image.id);
                                  if (sourceIndex < 0 || destinationIndex < 0) return;
                                  setProductImages((current) => reorderImages(current, sourceIndex, destinationIndex));
                                  setDraggedImageId(null);
                                }}
                                onDragEnd={() => setDraggedImageId(null)}
                                className="grid grid-cols-[auto_auto_1fr_auto] gap-3 items-center rounded-2xl bg-gray-50 p-3"
                              >
                                <button type="button" className="text-gray-400 cursor-grab active:cursor-grabbing" aria-label="Drag image to reorder">
                                  <GripVertical size={18} />
                                </button>
                                <img src={image.previewUrl} alt={image.altText || image.file.name} className="w-16 h-16 rounded-xl object-cover" />
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="font-medium text-gray-700">Sort #{index + 1}</span>
                                    {image.isPrimary && (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] text-amber-600">
                                        <Star size={12} fill="currentColor" /> Primary
                                      </span>
                                    )}
                                  </div>
                                  <Input
                                    value={image.altText}
                                    onChange={(event) => updateImage(image.id, (current) => ({ ...current, altText: event.target.value }))}
                                    placeholder="Image alt text (optional)"
                                  />
                                  <label className="flex items-center gap-2 text-xs text-gray-500">
                                    <input
                                      type="radio"
                                      checked={image.isPrimary}
                                      onChange={() => setPrimaryImage(image.id)}
                                      className="accent-gray-900"
                                    />
                                    Set as primary image
                                  </label>
                                </div>
                                <button type="button" onClick={() => removeImage(image.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                  <X size={18} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormField>
                  </div>

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
        {isPricingModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPricingModalOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-light">Adjust Pricing</h2>
                  <p className="text-xs text-gray-400 mt-1">{selectedProduct.name} ({selectedProduct.sku})</p>
                </div>
                <button onClick={() => setIsPricingModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAdjustPricing} className="grid grid-cols-2 gap-4">
                <FormField label="Buying Price">
                  <Input name="buyingPrice" type="number" min="0" step="0.01" defaultValue={selectedProduct.defaultBuyingPrice || 0} required />
                </FormField>
                <FormField label="Base Currency">
                  <SearchableSelect
                    name="adjustBaseCurrencyId"
                    required
                    value={pricingAdjustment.baseCurrencyId}
                    onChange={pricingAdjustment.setBaseCurrencyId}
                    placeholder="Select base currency"
                    searchPlaceholder="Search currencies"
                    options={currencyOptions}
                  />
                </FormField>
                <FormField label="Base Price">
                  <Input
                    name="adjustBasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={pricingAdjustment.basePrice}
                    onChange={(event) => pricingAdjustment.setBasePrice(Number(event.target.value || 0))}
                    required
                  />
                </FormField>
                <FormField label="Converted Amount">
                  <Input value={pricingAdjustment.convertedAmount.toFixed(2)} readOnly disabled />
                </FormField>
                <FormField label="Pricing Mode">
                  <SearchableSelect
                    name="pricingMode"
                    value={pricingAdjustment.pricingMode}
                    onChange={(value) => pricingAdjustment.setPricingMode(value as PricingMode)}
                    placeholder="Select pricing mode"
                    searchPlaceholder="Search pricing modes"
                    options={pricingModeOptions}
                  />
                </FormField>
                <FormField label="Selling Price">
                  <Input
                    name="sellingPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={(pricingAdjustment.pricingMode === 'PercentageBased' ? pricingAdjustment.computedSellingPrice : pricingAdjustment.sellingPrice).toFixed(2)}
                    onChange={(event) => pricingAdjustment.setSellingPrice(Number(event.target.value || 0))}
                    disabled={pricingAdjustment.pricingMode === 'PercentageBased'}
                    required
                  />
                </FormField>
                {pricingAdjustment.pricingMode === 'PercentageBased' && (
                  <FormField label="Markup %">
                    <Input
                      name="markupPercentage"
                      type="number"
                      min="0"
                      step="0.01"
                      value={pricingAdjustment.markupPercentage}
                      onChange={(event) => pricingAdjustment.setMarkupPercentage(Number(event.target.value || 0))}
                    />
                  </FormField>
                )}
                <div className="col-span-2">
                  <FormField label="Default Selling Currency">
                    <Input value={pricingAdjustment.defaultSellingCurrency?.code || currencySettings?.defaultSellingCurrencyCode || ''} readOnly disabled />
                  </FormField>
                </div>
                {pricingAdjustment.conversionMissing && (
                  <div className="col-span-2 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-700">
                    Missing exchange rate for this base currency and the tenant default selling currency.
                  </div>
                )}
                <div className="col-span-2">
                  <FormField label="Reason (Optional)">
                    <Input name="reason" placeholder="Reason for price change" />
                  </FormField>
                </div>
                <div className="col-span-2">
                  <Button type="submit" style={{ backgroundColor: 'var(--primary-color)' }}>
                    Save Pricing
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
