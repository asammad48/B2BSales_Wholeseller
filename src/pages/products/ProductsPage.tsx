import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import { DataTable } from '../../components/common/DataTable';
import {
  productsRepository,
  Product,
  CatalogLookups,
  CreateProductPayload,
  ProductPricingPayload,
} from '../../repositories/productsRepository';
import { Plus, Package, CheckCircle2, XCircle, X, GripVertical, ImagePlus, Trash2, BadgeDollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, FormField, Input, SearchableSelect, SearchableSelectOption, Select } from '../../components/common/Form';
import { PricingMode, ProductDetailResponseDto, QualityType, TrackingType } from '../../api/generated/apiClient';
import { requiresMarkup } from '../../utils/pricing';

const trackingOptions: TrackingType[] = ['QuantityBased', 'Serialized'];
const qualityOptions: QualityType[] = ['Original', 'OEM', 'HighCopy', 'Refurbished'];
const pricingOptions: PricingMode[] = ['Direct', 'PercentageBased'];
const textAreaClassName = 'w-full bg-gray-50 border-none rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-gray-200 transition-all';

type CreateProductFormState = Omit<CreateProductPayload, 'images'>;

type ProductImageFormItem = {
  id: string;
  file: File;
  previewUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
};

type PricingFormState = {
  buyingPrice: string;
  sellingPrice: string;
  pricingMode: PricingMode;
  markupPercentage: string;
  reason: string;
  updateDefaultPrice: boolean;
};

const initialCreateFormState: CreateProductFormState = {
  categoryId: '',
  brandId: undefined,
  modelId: undefined,
  partTypeId: undefined,
  sku: '',
  barcode: undefined,
  name: '',
  shortDescription: undefined,
  longDescription: undefined,
  specifications: undefined,
  trackingType: 'QuantityBased',
  qualityType: 'Original',
  defaultBuyingPrice: 0,
  defaultSellingPrice: 0,
  defaultPricingMode: 'Direct',
  defaultMarkupPercentage: undefined,
  warrantyDays: 0,
  lowStockThreshold: 0,
};

const buildCreatePayload = (form: CreateProductFormState, images: ProductImageFormItem[]): CreateProductPayload => ({
  ...form,
  brandId: form.brandId || undefined,
  modelId: form.modelId || undefined,
  partTypeId: form.partTypeId || undefined,
  barcode: form.barcode || undefined,
  shortDescription: form.shortDescription || undefined,
  longDescription: form.longDescription || undefined,
  specifications: form.specifications || undefined,
  defaultMarkupPercentage: requiresMarkup(form.defaultPricingMode) ? form.defaultMarkupPercentage ?? 0 : undefined,
  images: images.map((image, index) => ({
    file: image.file,
    altText: image.altText || undefined,
    isPrimary: image.isPrimary,
    sortOrder: index,
  })),
});

const buildPricingFormState = (product: ProductDetailResponseDto): PricingFormState => ({
  buyingPrice: String(product.defaultBuyingPrice ?? 0),
  sellingPrice: String(product.defaultSellingPrice ?? 0),
  pricingMode: product.defaultPricingMode || 'Direct',
  markupPercentage: String(product.defaultMarkupPercentage ?? 0),
  reason: '',
  updateDefaultPrice: true,
});

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [lookups, setLookups] = useState<CatalogLookups>({ categories: [], brands: [], models: [], partTypes: [] });
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProductFormState>(initialCreateFormState);
  const [productImages, setProductImages] = useState<ProductImageFormItem[]>([]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingProduct, setPricingProduct] = useState<ProductDetailResponseDto | null>(null);
  const [pricingForm, setPricingForm] = useState<PricingFormState>({
    buyingPrice: '0',
    sellingPrice: '0',
    pricingMode: 'Direct',
    markupPercentage: '0',
    reason: '',
    updateDefaultPrice: true,
  });
  const imageUrlsRef = useRef<string[]>([]);

  const categoryOptions = useMemo<SearchableSelectOption[]>(() => lookups.categories.map((item) => ({ value: item.id || '', label: item.name || '' })).filter((item) => item.value && item.label), [lookups.categories]);
  const brandOptions = useMemo<SearchableSelectOption[]>(() => lookups.brands.map((item) => ({ value: item.id || '', label: item.name || '' })).filter((item) => item.value && item.label), [lookups.brands]);
  const modelOptions = useMemo<SearchableSelectOption[]>(() => lookups.models.map((item) => ({ value: item.id || '', label: item.name || '' })).filter((item) => item.value && item.label), [lookups.models]);
  const partTypeOptions = useMemo<SearchableSelectOption[]>(() => lookups.partTypes.map((item) => ({ value: item.id || '', label: item.name || '' })).filter((item) => item.value && item.label), [lookups.partTypes]);

  const resetCreateForm = () => {
    setCreateForm(initialCreateFormState);
    setProductImages((current) => {
      current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return [];
    });
    setCreateError(null);
    setDraggedImageId(null);
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
    imageUrlsRef.current = productImages.map((image) => image.previewUrl);
  }, [productImages]);

  useEffect(() => () => {
    imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const updateCreateField = <K extends keyof CreateProductFormState>(field: K, value: CreateProductFormState[K]) => {
    setCreateForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'defaultPricingMode') {
        const pricingMode = value as PricingMode;
        next.defaultMarkupPercentage = requiresMarkup(pricingMode)
          ? current.defaultMarkupPercentage ?? 0
          : undefined;
      }
      return next;
    });
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []) as File[];
    if (!files.length) {
      return;
    }

    setProductImages((current) => {
      const hasPrimary = current.some((image) => image.isPrimary);
      const nextImages = files.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        file,
        previewUrl: URL.createObjectURL(file),
        altText: '',
        isPrimary: !hasPrimary && index === 0 && current.length === 0,
        sortOrder: current.length + index,
      }));

      return [...current, ...nextImages].map((image, index) => ({ ...image, sortOrder: index }));
    });

    event.target.value = '';
    setCreateError(null);
  };

  const handleImagePrimaryChange = (imageId: string) => {
    setProductImages((current) => current.map((image) => ({ ...image, isPrimary: image.id === imageId })));
    setCreateError(null);
  };

  const handleImageAltTextChange = (imageId: string, altText: string) => {
    setProductImages((current) => current.map((image) => (image.id === imageId ? { ...image, altText } : image)));
  };

  const handleRemoveImage = (imageId: string) => {
    setProductImages((current) => {
      const imageToRemove = current.find((image) => image.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      const remaining = current.filter((image) => image.id !== imageId).map((image, index) => ({ ...image, sortOrder: index }));
      if (remaining.length > 0 && !remaining.some((image) => image.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return remaining;
    });
  };

  const handleImageDrop = (targetImageId: string) => {
    if (!draggedImageId || draggedImageId === targetImageId) {
      return;
    }

    setProductImages((current) => {
      const draggedIndex = current.findIndex((image) => image.id === draggedImageId);
      const targetIndex = current.findIndex((image) => image.id === targetImageId);
      if (draggedIndex === -1 || targetIndex === -1) {
        return current;
      }

      const next = [...current];
      const [draggedItem] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, draggedItem);
      return next.map((image, index) => ({ ...image, sortOrder: index }));
    });

    setDraggedImageId(null);
  };

  const validateCreateForm = () => {
    if (!createForm.categoryId || !createForm.name.trim() || !createForm.sku.trim()) {
      return 'Please complete all required product details.';
    }

    if (productImages.length === 0) {
      return 'At least one product image is required.';
    }

    const primaryCount = productImages.filter((image) => image.isPrimary).length;
    if (primaryCount !== 1) {
      return 'Select exactly one primary image before creating the product.';
    }

    return null;
  };

  const handleCreateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateCreateForm();

    if (validationError) {
      setCreateError(validationError);
      return;
    }

    try {
      await productsRepository.createProduct(buildCreatePayload(createForm, productImages));
      setIsCreateModalOpen(false);
      resetCreateForm();
      fetchProducts();
    } catch (error) {
      console.error('Failed to create product', error);
      setCreateError('Failed to create product. Please review the form data and try again.');
    }
  };

  const openPricingModal = async (productId: string) => {
    setPricingLoading(true);
    setIsPricingModalOpen(true);
    try {
      const product = await productsRepository.getProductById(productId);
      setPricingProduct(product);
      setPricingForm(buildPricingFormState(product));
    } catch (error) {
      console.error('Failed to load product pricing', error);
      alert('Failed to load product pricing details');
      setIsPricingModalOpen(false);
    } finally {
      setPricingLoading(false);
    }
  };

  const handlePricingModeChange = (pricingMode: PricingMode) => {
    setPricingForm((current) => ({
      ...current,
      pricingMode,
      markupPercentage: requiresMarkup(pricingMode) ? current.markupPercentage || '0' : '0',
    }));
  };

  const handleSubmitPricing = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pricingProduct?.id) {
      return;
    }

    const payload: ProductPricingPayload = {
      productId: pricingProduct.id,
      buyingPrice: Number(pricingForm.buyingPrice),
      sellingPrice: Number(pricingForm.sellingPrice),
      pricingMode: pricingForm.pricingMode,
      markupPercentage: requiresMarkup(pricingForm.pricingMode) ? Number(pricingForm.markupPercentage || '0') : undefined,
      reason: pricingForm.reason.trim() || undefined,
      updateDefaultPrice: pricingForm.updateDefaultPrice,
    };

    try {
      await productsRepository.updatePricing(payload);
      setIsPricingModalOpen(false);
      setPricingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Failed to update pricing', error);
      alert('Failed to update pricing');
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
          onClick={(event) => {
            event.stopPropagation();
            openPricingModal(p.id);
          }}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          <BadgeDollarSign size={14} />
          Update Pricing
        </button>
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
              onClick={() => {
                resetCreateForm();
                setIsCreateModalOpen(true);
              }}
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
              onClick={() => {
                setIsCreateModalOpen(false);
                resetCreateForm();
              }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-[32px] shadow-xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light">Create New Product</h2>
                <button onClick={() => {
                  setIsCreateModalOpen(false);
                  resetCreateForm();
                }} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {lookupsLoading ? (
                <p className="text-sm text-gray-500">Loading lookups...</p>
              ) : (
                <form onSubmit={handleCreateProduct} className="grid grid-cols-2 gap-4">
                  <FormField label="Category">
                    <SearchableSelect
                      value={createForm.categoryId}
                      onChange={(value) => updateCreateField('categoryId', value)}
                      options={categoryOptions}
                      placeholder="Search category"
                    />
                  </FormField>
                  <FormField label="Part Type">
                    <SearchableSelect
                      value={createForm.partTypeId || ''}
                      onChange={(value) => updateCreateField('partTypeId', value || undefined)}
                      options={partTypeOptions}
                      placeholder="Search part type"
                      emptyLabel="No part type"
                    />
                  </FormField>

                  <FormField label="Brand">
                    <SearchableSelect
                      value={createForm.brandId || ''}
                      onChange={(value) => updateCreateField('brandId', value || undefined)}
                      options={brandOptions}
                      placeholder="Search brand"
                      emptyLabel="No brand"
                    />
                  </FormField>
                  <FormField label="Model">
                    <SearchableSelect
                      value={createForm.modelId || ''}
                      onChange={(value) => updateCreateField('modelId', value || undefined)}
                      options={modelOptions}
                      placeholder="Search model"
                      emptyLabel="No model"
                    />
                  </FormField>

                  <FormField label="Product Name">
                    <Input value={createForm.name} onChange={(event) => updateCreateField('name', event.target.value)} required />
                  </FormField>
                  <FormField label="SKU">
                    <Input value={createForm.sku} onChange={(event) => updateCreateField('sku', event.target.value)} required />
                  </FormField>

                  <FormField label="Barcode">
                    <Input value={createForm.barcode || ''} onChange={(event) => updateCreateField('barcode', event.target.value || undefined)} />
                  </FormField>
                  <FormField label="Tracking Type">
                    <Select value={createForm.trackingType} onChange={(event) => updateCreateField('trackingType', event.target.value as TrackingType)} required>
                      {trackingOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Quality Type">
                    <Select value={createForm.qualityType} onChange={(event) => updateCreateField('qualityType', event.target.value as QualityType)} required>
                      {qualityOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Pricing Mode">
                    <Select value={createForm.defaultPricingMode} onChange={(event) => updateCreateField('defaultPricingMode', event.target.value as PricingMode)} required>
                      {pricingOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Buying Price">
                    <Input value={createForm.defaultBuyingPrice} onChange={(event) => updateCreateField('defaultBuyingPrice', Number(event.target.value))} name="defaultBuyingPrice" type="number" min="0" step="0.01" required />
                  </FormField>
                  <FormField label="Selling Price">
                    <Input value={createForm.defaultSellingPrice} onChange={(event) => updateCreateField('defaultSellingPrice', Number(event.target.value))} type="number" min="0" step="0.01" required />
                  </FormField>

                  {requiresMarkup(createForm.defaultPricingMode) ? (
                    <FormField label="Markup %">
                      <Input value={createForm.defaultMarkupPercentage ?? 0} onChange={(event) => updateCreateField('defaultMarkupPercentage', Number(event.target.value))} type="number" min="0" step="0.01" />
                    </FormField>
                  ) : null}
                  <FormField label="Warranty Days">
                    <Input value={createForm.warrantyDays} onChange={(event) => updateCreateField('warrantyDays', Number(event.target.value))} type="number" min="0" required />
                  </FormField>

                  <FormField label="Low Stock Threshold">
                    <Input value={createForm.lowStockThreshold} onChange={(event) => updateCreateField('lowStockThreshold', Number(event.target.value))} type="number" min="0" required />
                  </FormField>
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-4 col-span-1">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Product Images</p>
                        <p className="text-xs text-gray-400">Add one or more images, choose one primary image, and drag to set sort order.</p>
                      </div>
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100">
                        <ImagePlus size={16} />
                        Add Images
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelection} />
                      </label>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <FormField label="Short Description">
                      <textarea value={createForm.shortDescription || ''} onChange={(event) => updateCreateField('shortDescription', event.target.value || undefined)} className={`${textAreaClassName} min-h-16`} />
                    </FormField>
                  </div>

                  <div className="col-span-2">
                    <FormField label="Long Description">
                      <textarea value={createForm.longDescription || ''} onChange={(event) => updateCreateField('longDescription', event.target.value || undefined)} className={`${textAreaClassName} min-h-24`} />
                    </FormField>
                  </div>

                  <div className="col-span-2">
                    <FormField label="Specifications">
                      <textarea value={createForm.specifications || ''} onChange={(event) => updateCreateField('specifications', event.target.value || undefined)} className={`${textAreaClassName} min-h-24`} />
                    </FormField>
                  </div>

                  <div className="col-span-2 rounded-3xl border border-gray-100 bg-gray-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">Image Order</p>
                        <p className="text-xs text-gray-400">Drag cards to change product image sort order.</p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{productImages.length} image(s)</span>
                    </div>

                    {productImages.length > 0 ? (
                      <div className="space-y-3">
                        {productImages.map((image, index) => (
                          <div
                            key={image.id}
                            draggable
                            onDragStart={() => setDraggedImageId(image.id)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={() => handleImageDrop(image.id)}
                            className="flex items-center gap-4 rounded-2xl border border-white bg-white p-3 shadow-sm"
                          >
                            <button type="button" className="cursor-grab text-gray-400 active:cursor-grabbing">
                              <GripVertical size={18} />
                            </button>
                            <img src={image.previewUrl} alt={image.altText || image.file.name} className="h-20 w-20 rounded-xl object-cover" />
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{image.file.name}</p>
                                  <p className="text-xs text-gray-400">Sort order: {index + 1}</p>
                                </div>
                                <label className="flex items-center gap-2 text-xs font-medium text-gray-500">
                                  <input
                                    type="radio"
                                    name="primaryImage"
                                    checked={image.isPrimary}
                                    onChange={() => handleImagePrimaryChange(image.id)}
                                  />
                                  Primary
                                </label>
                              </div>
                              <Input
                                value={image.altText}
                                onChange={(event) => handleImageAltTextChange(image.id, event.target.value)}
                                placeholder="Alt text (optional)"
                              />
                            </div>
                            <button type="button" onClick={() => handleRemoveImage(image.id)} className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-red-500">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-2xl bg-white px-4 py-5 text-sm text-gray-400">Select at least one image to continue.</p>
                    )}
                  </div>

                  {createError ? <p className="col-span-2 text-sm text-red-500">{createError}</p> : null}

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
        {isPricingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsPricingModalOpen(false);
                setPricingProduct(null);
              }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-xl p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-light">Update Pricing</h2>
                  {pricingProduct?.name ? <p className="mt-1 text-xs text-gray-400">{pricingProduct.name}</p> : null}
                </div>
                <button onClick={() => {
                  setIsPricingModalOpen(false);
                  setPricingProduct(null);
                }} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              {pricingLoading || !pricingProduct ? (
                <p className="text-sm text-gray-500">Loading pricing details...</p>
              ) : (
                <form onSubmit={handleSubmitPricing} className="space-y-4">
                  <FormField label="Buying Price">
                    <Input value={pricingForm.buyingPrice} onChange={(event) => setPricingForm((current) => ({ ...current, buyingPrice: event.target.value }))} type="number" min="0" step="0.01" required />
                  </FormField>
                  <FormField label="Selling Price">
                    <Input value={pricingForm.sellingPrice} onChange={(event) => setPricingForm((current) => ({ ...current, sellingPrice: event.target.value }))} type="number" min="0" step="0.01" required />
                  </FormField>
                  <FormField label="Pricing Mode">
                    <Select value={pricingForm.pricingMode} onChange={(event) => handlePricingModeChange(event.target.value as PricingMode)}>
                      {pricingOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Select>
                  </FormField>
                  {requiresMarkup(pricingForm.pricingMode) ? (
                    <FormField label="Markup %">
                      <Input value={pricingForm.markupPercentage} onChange={(event) => setPricingForm((current) => ({ ...current, markupPercentage: event.target.value }))} type="number" min="0" step="0.01" required />
                    </FormField>
                  ) : null}
                  <FormField label="Reason">
                    <Input value={pricingForm.reason} onChange={(event) => setPricingForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Optional pricing note" />
                  </FormField>
                  <label className="flex items-center gap-2 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={pricingForm.updateDefaultPrice}
                      onChange={(event) => setPricingForm((current) => ({ ...current, updateDefaultPrice: event.target.checked }))}
                    />
                    Update default pricing on the product record
                  </label>
                  <Button type="submit" style={{ backgroundColor: 'var(--primary-color)' }}>
                    Save Pricing
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
