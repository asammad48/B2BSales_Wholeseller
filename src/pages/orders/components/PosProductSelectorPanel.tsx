import React from 'react';
import { Minus, Plus, Search, TriangleAlert } from 'lucide-react';
import { Input } from '../../../components/common/Form';
import { PosProduct } from '../../../repositories/posOrdersRepository';

interface PosProductSelectorPanelProps {
  loading: boolean;
  products: PosProduct[];
  search: string;
  onSearchChange: (value: string) => void;
  quantities: Record<string, number>;
  onIncrement: (product: PosProduct) => void;
  onDecrement: (product: PosProduct) => void;
  disabled?: boolean;
}

const formatMoney = (value: number, currencyCode?: string) => `${currencyCode ? `${currencyCode} ` : '$'}${value.toFixed(2)}`;

export const PosProductSelectorPanel: React.FC<PosProductSelectorPanelProps> = ({
  loading,
  products,
  search,
  onSearchChange,
  quantities,
  onIncrement,
  onDecrement,
  disabled = false,
}) => {
  return (
    <section className="rounded-[28px] bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">POS Products</p>
            <h2 className="mt-2 text-2xl font-light text-gray-900">Stocked items ready to sell</h2>
            <p className="mt-2 text-sm text-gray-500">Search stocked products, review available quantity, and add items into the receipt.</p>
          </div>
          <div className="rounded-2xl bg-gray-50 px-4 py-3 text-right min-w-[112px]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Visible</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">{products.length}</p>
          </div>
        </div>

        <div className="relative mt-5">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search stocked products by name, SKU, barcode, or brand"
            className="pl-11"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="max-h-[calc(100vh-18rem)] overflow-y-auto p-4 sm:p-5 space-y-3 bg-gray-50/40">
        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            Loading stocked POS products...
          </div>
        ) : products.length ? (
          products.map((product) => {
            const selectedQty = quantities[product.productId] || 0;
            const isSoldOut = product.quantityInHand <= 0;

            return (
              <div key={product.productId} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-gray-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{product.productName}</h3>
                      {product.isLowStock ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                          <TriangleAlert size={12} /> Low stock
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {[product.sku, product.brandName, product.modelName].filter(Boolean).join(' • ') || 'No secondary product details'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">{formatMoney(product.sellingPrice, product.currencyCode)}</span>
                      <span>In hand: <strong className="text-gray-800">{product.quantityInHand}</strong></span>
                      {product.lowStockThreshold > 0 ? <span>Low stock at: <strong className="text-gray-800">{product.lowStockThreshold}</strong></span> : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl bg-gray-50 p-2">
                    <button
                      type="button"
                      onClick={() => onDecrement(product)}
                      disabled={disabled || selectedQty <= 0}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Minus size={15} />
                    </button>
                    <div className="min-w-[52px] text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Qty</p>
                      <p className="text-base font-semibold text-gray-900">{selectedQty}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onIncrement(product)}
                      disabled={disabled || isSoldOut || selectedQty >= product.quantityInHand}
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No stocked products matched the current filters.
          </div>
        )}
      </div>
    </section>
  );
};
