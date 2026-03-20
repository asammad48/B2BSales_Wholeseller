import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import { productsRepository, Product, CatalogLookups, CreateProductPayload } from '../../repositories/productsRepository';
import { Plus, Package, CheckCircle2, XCircle, X, DollarSign, GripVertical, Star, Trash2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FormField, Input, Select, Button, SearchableSelect, SearchableSelectOption } from '../../components/common/Form';
import { PricingMode, QualityType, TrackingType } from '../../api/generated/apiClient';
import { isPercentageBasedPricingMode, normalizeMarkupValue } from '../../utils/pricing';

const trackingOptions: TrackingType[] = ['QuantityBased', 'Serialized'];
const qualityOptions: QualityType[] = ['Original', 'OEM', 'HighCopy', 'Refurbished'];
const pricingOptions: PricingMode[] = ['Direct', 'PercentageBased'];

interface ProductImageDraft {
  id: string;
  file: File;
  previewUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

const mapLookupOptions = (items: Array<{ id?: string; name?: string }>): SearchableSelectOption[] => (
  items.map((item) => ({
    value: item.id || '',
    label: item.name || '',
  })).filter((item) => item.value && item.label)
);

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lookups, setLookups] = useState<CatalogLookups>({ categories: [], brands: [], models: [], partTypes: [] });
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [createSelections, setCreateSelections] = useState({
    categoryId: '',
    partTypeId: '',
    brandId: '',
    modelId: '',
  });
  const [createPricingMode, setCreatePricingMode] = useState<PricingMode>('Direct');
  const [createMarkupValue, setCreateMarkupValue] = useState('0');
  const [productImages, setProductImages] = useState<ProductImageDraft[]>([]);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const productImagesRef = useRef<ProductImageDraft[]>([]);
  const [pricingForm, setPricingForm] = useState({
    pricingMode: 'Direct' as PricingMode,
    markupPercentage: '0',
  });

  const categoryOptions = useMemo(() => mapLookupOptions(lookups.categories), [lookups.categories]);
  const partTypeOptions = useMemo(() => mapLookupOptions(lookups.partTypes), [lookups.partTypes]);
  const brandOptions = useMemo(() => mapLookupOptions(lookups.brands), [lookups.brands]);
  const modelOptions = useMemo(() => mapLookupOptions(lookups.models), [lookups.models]);

  const resetCreateFormState = () => {
    setCreateSelections({
      categoryId: '',
      partTypeId: '',
      brandId: '',
      modelId: '',
    });
    setCreatePricingMode('Direct');
    setCreateMarkupValue('0');
    setDraggedImageId(null);
    setProductImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return [];
    });
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCreateFormState();
  };

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

  useEffect(() => {
    productImagesRef.current = productImages;
  }, [productImages]);

  useEffect(() => () => {
    productImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
  }, []);

  useEffect(() => {
    if (!isPricingModalOpen || !selectedProduct) {
      return;
    }

    const nextPricingMode = selectedProduct.defaultPricingMode || 'Direct';
    setPricingForm({
      pricingMode: nextPricingMode,
      markupPercentage: String(normalizeMarkupValue(nextPricingMode, selectedProduct.defaultMarkupPercentage) ?? 0),
    });
  }, [isPricingModalOpen, selectedProduct]);

  const handleCreateImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []) as File[];

    if (!files.length) {
      return;
    }

    setProductImages((current) => {
      const shouldSetPrimary = current.length === 0;
      const nextImages = files.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        file,
        previewUrl: URL.createObjectURL(file),
        altText: '',
        isPrimary: shouldSetPrimary && index === 0,
        sortOrder: current.length + index,
      }));

      return [...current, ...nextImages];
    });

    event.target.value = '';
  };

  const handleImageAltTextChange = (imageId: string, altText: string) => {
    setProductImages((current) => current.map((image) => (
      image.id === imageId ? { ...image, altText } : image
    )));
  };

  const handlePrimaryImageChange = (imageId: string) => {
    setProductImages((current) => current.map((image) => ({
      ...image,
      isPrimary: image.id === imageId,
    })));
  };

  const handleRemoveImage = (imageId: string) => {
    setProductImages((current) => {
      const removedImage = current.find((image) => image.id === imageId);
      if (removedImage) {
        URL.revokeObjectURL(removedImage.previewUrl);
      }

      const remaining = current.filter((image) => image.id !== imageId);
      return remaining.map((image, index) => ({
        ...image,
        isPrimary: remaining.some((item) => item.isPrimary) ? image.isPrimary : index === 0,
        sortOrder: index,
      }));
    });
  };

  const moveImage = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) {
      return;
    }

    setProductImages((current) => {
      const sourceIndex = current.findIndex((image) => image.id === sourceId);
      const targetIndex = current.findIndex((image) => image.id === targetId);

      if (sourceIndex < 0 || targetIndex < 0) {
        return current;
      }

      const nextImages = [...current];
      const [movedImage] = nextImages.splice(sourceIndex, 1);
      nextImages.splice(targetIndex, 0, movedImage);

      return nextImages.map((image, index) => ({
        ...image,
        sortOrder: index,
      }));
    });
  };

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

    const primaryImageCount = productImages.filter((image) => image.isPrimary).length;

    if (!productImages.length) {
      alert('At least one image is required');
      return;
    }

    if (primaryImageCount !== 1) {
      alert('Please select exactly one primary image');
      return;
    }

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
      defaultMarkupPercentage: normalizeMarkupValue(
        formData.get('defaultPricingMode') as PricingMode,
        toNumber(formData.get('defaultMarkupPercentage'))
      ),
      warrantyDays: Number(formData.get('warrantyDays')),
      lowStockThreshold: Number(formData.get('lowStockThreshold')),
      images: productImages.map((image, index) => ({
        file: image.file,
        altText: image.altText.trim() || undefined,
        isPrimary: image.isPrimary,
        sortOrder: index,
      })),
    };

    try {
      await productsRepository.createProduct(body);
      closeCreateModal();
      fetchProducts();
    } catch (error) {
      console.error('Failed to create product', error);
      alert('Failed to create product');
    }
  };

  const handleAdjustPricing = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const formData = new FormData(e.currentTarget);
    const buyingPrice = Number(formData.get('buyingPrice'));
    const sellingPrice = Number(formData.get('sellingPrice'));
    const pricingMode = formData.get('pricingMode') as PricingMode;
    const markupRaw = (formData.get('markupPercentage') as string)?.trim();
    const reasonRaw = (formData.get('reason') as string)?.trim();

    if (buyingPrice < 0 || sellingPrice < 0) {
      alert('Buying and selling prices must be non-negative');
      return;
    }

    try {
      await productsRepository.adjustProductPricing(selectedProduct.id, {
        buyingPrice,
        sellingPrice,
        pricingMode,
        markupPercentage: normalizeMarkupValue(pricingMode, markupRaw ? Number(markupRaw) : undefined),
        reason: reasonRaw || undefined,
        updateDefaultPrice: true,
      });
      setIsPricingModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Failed to adjust pricing', error);
      alert('Failed to adjust pricing');
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
              onClick={closeCreateModal}
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
                <button onClick={closeCreateModal} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {lookupsLoading ? (
                <p className="text-sm text-gray-500">Loading lookups...</p>
              ) : (
                <form onSubmit={handleCreateProduct} className="grid grid-cols-2 gap-4">
                  <FormField label="Category">
                    <SearchableSelect
                      name="categoryId"
                      value={createSelections.categoryId}
                      onChange={(value) => setCreateSelections((current) => ({ ...current, categoryId: value }))}
                      options={categoryOptions}
                      placeholder="Select category"
                      searchPlaceholder="Search categories"
                      required
                    />
                  </FormField>
                  <FormField label="Part Type">
                    <SearchableSelect
                      name="partTypeId"
                      value={createSelections.partTypeId}
                      onChange={(value) => setCreateSelections((current) => ({ ...current, partTypeId: value }))}
                      options={partTypeOptions}
                      placeholder="Select part type (optional)"
                      searchPlaceholder="Search part types"
                    />
                  </FormField>

                  <FormField label="Brand">
                    <SearchableSelect
                      name="brandId"
                      value={createSelections.brandId}
                      onChange={(value) => setCreateSelections((current) => ({ ...current, brandId: value }))}
                      options={brandOptions}
                      placeholder="Select brand (optional)"
                      searchPlaceholder="Search brands"
                    />
                  </FormField>
                  <FormField label="Model">
                    <SearchableSelect
                      name="modelId"
                      value={createSelections.modelId}
                      onChange={(value) => setCreateSelections((current) => ({ ...current, modelId: value }))}
                      options={modelOptions}
                      placeholder="Select model (optional)"
                      searchPlaceholder="Search models"
                    />
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
                    <Select
                      name="defaultPricingMode"
                      required
                      value={createPricingMode}
                      onChange={(event) => {
                        const nextValue = event.target.value as PricingMode;
                        setCreatePricingMode(nextValue);
                        setCreateMarkupValue(String(normalizeMarkupValue(nextValue) ?? 0));
                      }}
                    >
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

                  {isPercentageBasedPricingMode(createPricingMode) && (
                    <FormField label="Markup %">
                      <Input
                        name="defaultMarkupPercentage"
                        type="number"
                        min="0"
                        step="0.01"
                        value={createMarkupValue}
                        onChange={(event) => setCreateMarkupValue(event.target.value)}
                      />
                    </FormField>
                  )}
                  <FormField label="Warranty Days">
                    <Input name="warrantyDays" type="number" min="0" required />
                  </FormField>

                  <FormField label="Low Stock Threshold">
                    <Input name="lowStockThreshold" type="number" min="0" required />
                  </FormField>

                  <div className="col-span-2 rounded-3xl border border-dashed border-gray-200 bg-gray-50/60 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Product Images</p>
                        <p className="text-xs text-gray-400">Add one or more images, choose one primary image, and drag cards to set sort order.</p>
                      </div>
                      <label className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm cursor-pointer hover:bg-gray-100 transition-colors">
                        <Upload size={16} />
                        <span>Add Images</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleCreateImageSelection} />
                      </label>
                    </div>

                    {productImages.length > 0 ? (
                      <div className="space-y-3">
                        {productImages.map((image) => (
                          <div
                            key={image.id}
                            draggable
                            onDragStart={() => setDraggedImageId(image.id)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => {
                              if (draggedImageId) {
                                moveImage(draggedImageId, image.id);
                                setDraggedImageId(null);
                              }
                            }}
                            onDragEnd={() => setDraggedImageId(null)}
                            className="grid grid-cols-[auto_96px_1fr_auto] gap-4 rounded-2xl bg-white p-4 shadow-sm items-center"
                          >
                            <div className="text-gray-300 cursor-grab">
                              <GripVertical size={18} />
                            </div>
                            <img src={image.previewUrl} alt={image.altText || image.file.name} className="h-24 w-24 rounded-2xl object-cover bg-gray-100" />
                            <div className="space-y-3">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                                <span className="font-medium text-gray-800">{image.file.name}</span>
                                <span>Sort order: {image.sortOrder + 1}</span>
                              </div>
                              <Input
                                value={image.altText}
                                onChange={(event) => handleImageAltTextChange(image.id, event.target.value)}
                                placeholder="Alt text (optional)"
                              />
                              <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                <input
                                  type="radio"
                                  name="primaryProductImage"
                                  checked={image.isPrimary}
                                  onChange={() => handlePrimaryImageChange(image.id)}
                                />
                                <span className="inline-flex items-center gap-1">
                                  <Star size={14} className={image.isPrimary ? 'text-amber-500 fill-amber-500' : 'text-gray-400'} />
                                  Primary image
                                </span>
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(image.id)}
                              className="rounded-xl p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="Remove image"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-2xl bg-white px-4 py-5 text-sm text-red-500">At least one image is required before you can create the product.</p>
                    )}
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
                <FormField label="Selling Price">
                  <Input name="sellingPrice" type="number" min="0" step="0.01" defaultValue={selectedProduct.defaultSellingPrice || selectedProduct.basePrice || 0} required />
                </FormField>
                <FormField label="Pricing Mode">
                  <Select
                    name="pricingMode"
                    value={pricingForm.pricingMode}
                    onChange={(event) => {
                      const nextValue = event.target.value as PricingMode;
                      setPricingForm({
                        pricingMode: nextValue,
                        markupPercentage: String(normalizeMarkupValue(nextValue) ?? 0),
                      });
                    }}
                  >
                    {pricingOptions.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </Select>
                </FormField>
                {isPercentageBasedPricingMode(pricingForm.pricingMode) && (
                  <FormField label="Markup %">
                    <Input
                      name="markupPercentage"
                      type="number"
                      min="0"
                      step="0.01"
                      value={pricingForm.markupPercentage}
                      onChange={(event) => setPricingForm((current) => ({ ...current, markupPercentage: event.target.value }))}
                    />
                  </FormField>
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
