import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ShoppingCart, 
  Lock, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Star,
  ArrowLeft,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { publicStoreRepository } from '../../repositories/publicStoreRepository';
import { ProductDetailResponseDto, RelatedProductResponseDto } from '../../api/generated/apiClient';
import { useAuth } from '../../state/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState<ProductDetailResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await publicStoreRepository.getProductDetail(id);
        setProduct(data);
        setActiveImage(data.primaryImageUrl || (data.images && data.images[0]?.filePath));
      } catch (err: any) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
          <p className="text-[var(--text-muted)] animate-pulse">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
        <div className="admin-card p-8 max-w-md w-full text-center">
          <AlertCircle size={48} className="text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-[var(--text-muted)] mb-6">{error || 'Product not found'}</p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={18} />
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  const isGuest = !isAuthenticated;
  const canOrder = product.canOrder && !isGuest;

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-secondary)] pb-20">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">Store</Link>
          <ChevronRight size={14} />
          <span className="hover:text-[var(--color-primary)] transition-colors cursor-pointer">{product.categoryName}</span>
          <ChevronRight size={14} />
          <span className="text-white font-medium truncate">{product.name}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Image Gallery */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square admin-card overflow-hidden relative group"
            >
              <img 
                src={activeImage || 'https://picsum.photos/seed/product/800/800'} 
                alt={product.name}
                className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              {product.isPriceLocked && isGuest && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="bg-black/60 px-4 py-2 rounded-full border border-[var(--surface-overlay-border)] flex items-center gap-2 text-white text-sm backdrop-blur-md">
                    <Lock size={14} className="text-[var(--color-primary)]" />
                    Login to view price
                  </div>
                </div>
              )}
            </motion.div>

            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-4">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(img.filePath)}
                    className={cn(
                      "aspect-square admin-card p-2 overflow-hidden transition-all",
                      activeImage === img.filePath ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20" : "hover:border-[var(--surface-overlay-border)]"
                    )}
                  >
                    <img 
                      src={img.filePath} 
                      alt={`${product.name} ${idx + 1}`}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold uppercase tracking-wider">
                  {product.brandName}
                </span>
                <span className="text-[var(--text-muted)] text-xs">•</span>
                <span className="text-[var(--text-muted)] text-xs font-medium">
                  Model: {product.modelName}
                </span>
              </div>

              <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={16} fill={i <= 4 ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-[var(--text-muted)] text-sm">(4.8 • 124 Reviews)</span>
              </div>

              <div className="admin-card p-6 mb-8 bg-gradient-to-br from-[var(--surface-overlay-5)] to-transparent">
                <div className="flex items-baseline gap-4 mb-2">
                  {isGuest ? (
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-white blur-sm select-none">$ •••.••</span>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">
                        <Lock size={12} />
                        LOCKED
                      </div>
                    </div>
                  ) : (
                    <span className="text-4xl font-bold text-[var(--color-primary)]">
                      ${product.defaultSellingPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[var(--text-muted)]">
                  {product.availabilityMessage || (product.isActive ? 'In Stock • Ready to ship' : 'Out of Stock')}
                </p>
              </div>

              <div className="space-y-4 mb-10">
                <button 
                  disabled={!canOrder}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg",
                    canOrder 
                      ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-[var(--color-primary-glow)]" 
                      : "bg-[var(--surface-overlay-5)] text-white/20 cursor-not-allowed border border-[var(--surface-overlay-border)]"
                  )}
                >
                  <ShoppingCart size={22} />
                  {isGuest ? 'Login to Order' : (product.canOrder ? 'Add to Cart' : 'Unavailable')}
                </button>
                
                {isGuest && (
                  <Link 
                    to="/login" 
                    className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all"
                  >
                    Sign In to View Pricing
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--surface-overlay-5)] border border-[var(--surface-overlay-border)]">
                  <ShieldCheck className="text-[var(--color-primary)] shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-bold text-white">Warranty</p>
                    <p className="text-xs text-[var(--text-muted)]">{product.warrantyDays} Days Protection</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--surface-overlay-5)] border border-[var(--surface-overlay-border)]">
                  <Truck className="text-[var(--color-primary)] shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-bold text-white">Shipping</p>
                    <p className="text-xs text-[var(--text-muted)]">Global Mobia2Z Delivery</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Tabs / Details */}
        <div className="mt-20 border-t border-[var(--border-subtle)] pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <section>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <Info size={24} className="text-[var(--color-primary)]" />
                  Product Description
                </h2>
                <div className="prose prose-invert max-w-none text-[var(--text-secondary)] leading-relaxed">
                  <p className="mb-4 font-medium text-white/80">{product.shortDescription}</p>
                  <p>{product.longDescription || 'No detailed description available for this product.'}</p>
                </div>
              </section>

              {product.specifications && (
                <section>
                  <h2 className="text-2xl font-bold text-white mb-6">Technical Specifications</h2>
                  <div className="admin-card overflow-hidden">
                    <div className="divide-y divide-[var(--border-subtle)]">
                      {product.specifications.split('\n').map((spec, idx) => {
                        const [label, value] = spec.split(':');
                        if (!label) return null;
                        return (
                          <div key={idx} className="grid grid-cols-2 p-4 hover:bg-[var(--surface-overlay-5)] transition-colors">
                            <span className="text-sm font-medium text-[var(--text-muted)]">{label.trim()}</span>
                            <span className="text-sm text-white font-medium">{value?.trim() || '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-8">
              <div className="admin-card p-6 border-l-4 border-l-[var(--color-primary)]">
                <h3 className="font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-[var(--color-primary)]" />
                  Wholesale Benefits
                </h3>
                <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                  <li className="flex items-center gap-2">• Bulk pricing discounts</li>
                  <li className="flex items-center gap-2">• Priority dispatch</li>
                  <li className="flex items-center gap-2">• Dedicated account manager</li>
                  <li className="flex items-center gap-2">• Flexible payment terms</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <div className="mt-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Related Products</h2>
              <Link to="/products" className="text-[var(--color-primary)] hover:underline text-sm font-medium">View All</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {product.relatedProducts.map((rel) => (
                <Link 
                  key={rel.id} 
                  to={`/product/${rel.id}`}
                  className="admin-card admin-card-hover p-4 group"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-[var(--surface-overlay-5)] mb-4 p-4">
                    <img 
                      src={rel.primaryImageUrl || 'https://picsum.photos/seed/rel/400/400'} 
                      alt={rel.name}
                      className="w-full h-full object-contain transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p className="text-xs text-[var(--color-primary)] font-bold uppercase mb-1">{rel.brandName}</p>
                  <h4 className="text-white font-bold truncate mb-2">{rel.name}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-primary)] font-bold">
                      {isGuest ? 'Locked' : `$${rel.defaultSellingPrice?.toFixed(2)}`}
                    </span>
                    <div className="p-2 rounded-lg bg-[var(--surface-overlay-5)] text-[var(--text-muted)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-all">
                      <ShoppingCart size={16} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
