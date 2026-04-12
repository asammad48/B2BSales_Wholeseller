import React from 'react';
import { CheckCircle2, Download, Minus, PackageCheck, Plus, Printer, ReceiptText, RotateCcw } from 'lucide-react';
import { Button, FormField, Input, SearchableSelect, SearchableSelectOption } from '../../../components/common/Form';
import { ClientLookupItem } from '../../../repositories/clientsRepository';
import { PosProduct } from '../../../repositories/posOrdersRepository';
import { ShopLookupItem } from '../../../repositories/shopsRepository';
import { PosCartItem, PosOrderReceipt } from '../PosCreateOrderPage';

interface PosOrderSummaryPanelProps {
  cartItems: PosCartItem[];
  subtotal: number;
  total: number;
  shopId: string;
  onShopChange: (value: string) => void;
  shops: ShopLookupItem[];
  clientId: string;
  onClientChange: (value: string) => void;
  clients: ClientLookupItem[];
  notes: string;
  onNotesChange: (value: string) => void;
  onIncrementItem: (product: PosProduct) => void;
  onDecrementItem: (product: PosProduct) => void;
  onSerializedSelectionChange: (productId: string, barcodes: string[]) => void;
  onSubmit: () => void;
  submitting: boolean;
  receipt: PosOrderReceipt | null;
  onPrintReceipt: () => void;
  onStartNewSale: () => void;
}

const formatMoney = (value: number, currencyCode?: string) => `${currencyCode ? `${currencyCode} ` : '$'}${value.toFixed(2)}`;

const mapShopOptions = (items: ShopLookupItem[]): SearchableSelectOption[] =>
  items.map((item) => ({
    value: item.id,
    label: item.name,
    searchText: item.code,
  }));

const mapClientOptions = (items: ClientLookupItem[]): SearchableSelectOption[] =>
  items.map((item) => ({
    value: item.id,
    label: item.name,
  }));

const buildSerializedOptionLabel = (product: PosProduct, barcodeValue: string) => {
  const matchedUnit = product.barcodes.find((unit) => unit.barcode === barcodeValue);
  const parts = [
    matchedUnit?.imei1 ? `IMEI 1: ${matchedUnit.imei1}` : undefined,
    matchedUnit?.imei2 ? `IMEI 2: ${matchedUnit.imei2}` : undefined,
    matchedUnit?.barcode ? `Barcode: ${matchedUnit.barcode}` : barcodeValue,
  ].filter(Boolean);

  return parts.join(' • ');
};

export const PosOrderSummaryPanel: React.FC<PosOrderSummaryPanelProps> = ({
  cartItems,
  subtotal,
  total,
  shopId,
  onShopChange,
  shops,
  clientId,
  onClientChange,
  clients,
  notes,
  onNotesChange,
  onIncrementItem,
  onDecrementItem,
  onSerializedSelectionChange,
  onSubmit,
  submitting,
  receipt,
  onPrintReceipt,
  onStartNewSale,
}) => {
  const currencyCode = receipt?.currencyCode || cartItems[0]?.product.currencyCode;
  const discountAmount = receipt?.discountAmount || 0;
  const taxAmount = receipt?.taxAmount || 0;
  const grandTotal = receipt?.totalAmount ?? total;

  const buildSerializedOptions = (product: PosProduct, selectedBarcodes: string[], currentValue: string) => {
    const selectedSet = new Set(selectedBarcodes.filter((value) => value && value !== currentValue));

    return product.barcodes
      .filter((unit) => unit.barcode && (!selectedSet.has(unit.barcode) || unit.barcode === currentValue))
      .map((unit) => ({
        value: unit.barcode,
        label: buildSerializedOptionLabel(product, unit.barcode),
        searchText: [product.productName, product.sku, unit.imei1, unit.imei2, unit.barcode].filter(Boolean).join(' '),
      }));
  };

  return (
    <aside className="rounded-[28px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-sm overflow-hidden">
      <div className="border-b border-[var(--border-subtle)] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Receipt Summary</p>
            <h2 className="mt-1 text-xl font-medium text-gray-900">Order summary</h2>
          </div>
          {receipt ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-emerald-700">
              <CheckCircle2 size={14} /> Fulfilled
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-surface-variant-strong)] px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-600">
              <ReceiptText size={14} /> Draft
            </span>
          )}
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-4">
          <FormField label="Shop">
            <SearchableSelect
              name="shopId"
              value={shopId}
              onChange={onShopChange}
              options={mapShopOptions(shops)}
              placeholder="Select shop"
              searchPlaceholder="Search shops"
              required
              disabled={submitting || Boolean(receipt)}
            />
          </FormField>
          <FormField label="Client (optional)">
            <SearchableSelect
              name="clientId"
              value={clientId}
              onChange={onClientChange}
              options={mapClientOptions(clients)}
              placeholder="Select client"
              searchPlaceholder="Search clients"
              disabled={submitting || Boolean(receipt)}
            />
          </FormField>
          <FormField label="Notes">
            <Input
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder="Optional sale notes"
              disabled={submitting || Boolean(receipt)}
            />
          </FormField>
        </div>

        <div className="rounded-[24px] border border-[var(--border-subtle)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Selected items</h3>
            <span className="text-xs text-gray-400">{cartItems.length} lines</span>
          </div>
          <div className="max-h-[320px] overflow-y-auto divide-y divide-[var(--border-subtle)] bg-[var(--bg-surface-variant)]">
            {cartItems.length ? (
              cartItems.map((item) => (
                <div key={item.product.productId} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.product.productName}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.product.sku || item.product.barcode || 'POS item'}</p>
                      {item.product.barcodes.length ? (
                        <div className="mt-2 space-y-3">
                          <p className="text-[11px] text-gray-400">
                            Serialized stock available: {item.product.barcodes.length}. Select {item.quantity} IMEI/barcode entr{item.quantity === 1 ? 'y' : 'ies'} below.
                          </p>
                          <div className="space-y-2">
                            {Array.from({ length: item.quantity }, (_, index) => {
                              const selectedValue = item.selectedBarcodes[index] || '';
                              const options = buildSerializedOptions(item.product, item.selectedBarcodes, selectedValue);

                              return (
                                <FormField key={`${item.product.productId}-serialized-${index}`} label={`Serialized unit ${index + 1}`}>
                                  <SearchableSelect
                                    name={`${item.product.productId}-barcode-${index}`}
                                    value={selectedValue}
                                    onChange={(value) => {
                                      const nextSelections = [...item.selectedBarcodes];
                                      nextSelections[index] = value;
                                      onSerializedSelectionChange(item.product.productId, nextSelections);
                                    }}
                                    options={options}
                                    placeholder="Select IMEI / barcode"
                                    searchPlaceholder="Search IMEI 1, IMEI 2, or barcode"
                                    disabled={submitting || Boolean(receipt)}
                                    noResultsText="No serialized units left to select"
                                  />
                                </FormField>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatMoney(item.lineTotal, item.product.currencyCode)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">{formatMoney(item.product.sellingPrice, item.product.currencyCode)} each</p>
                    <div className="flex items-center gap-2 rounded-2xl bg-[var(--bg-surface)] p-1.5">
                      <button
                        type="button"
                        onClick={() => onDecrementItem(item.product)}
                        disabled={submitting || Boolean(receipt)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-strong)] text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-[28px] text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onIncrementItem(item.product)}
                        disabled={submitting || Boolean(receipt) || item.quantity >= (item.product.barcodes.length > 0 ? item.product.barcodes.length : item.product.quantityInHand)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">Add products from the left panel to start a POS order.</div>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--border-subtle)] p-5 space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatMoney(receipt?.subtotal ?? subtotal, currencyCode)}</span></div>
          <div className="flex items-center justify-between text-sm text-gray-600"><span>Discount</span><span>{formatMoney(discountAmount, currencyCode)}</span></div>
          <div className="flex items-center justify-between text-sm text-gray-600"><span>Tax</span><span>{formatMoney(taxAmount, currencyCode)}</span></div>
          <div className="border-t border-[var(--border-subtle)] pt-3 flex items-center justify-between text-base font-semibold text-gray-900"><span>Total</span><span>{formatMoney(grandTotal, currencyCode)}</span></div>
        </div>

        {receipt ? (
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-5 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Completed order</p>
              <h3 className="mt-2 text-lg font-semibold text-emerald-900">{receipt.orderNumber}</h3>
              <p className="mt-1 text-sm text-emerald-800">This sale has already been fulfilled and the receipt PDF is ready.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-2xl bg-[var(--bg-surface-elevated)] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Status</p>
                <p className="mt-1 font-medium text-emerald-900">{receipt.status || 'Completed'}</p>
              </div>
              <div className="rounded-2xl bg-[var(--bg-surface-elevated)] p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Barcode</p>
                <p className="mt-1 font-medium text-emerald-900">{receipt.barcodeValue || 'Not provided'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button type="button" onClick={onPrintReceipt} className="!w-full inline-flex items-center justify-center gap-2">
                <Printer size={16} /> Print
              </Button>
              <Button type="button" variant="secondary" onClick={onStartNewSale} className="!w-full inline-flex items-center justify-center gap-2">
                <RotateCcw size={16} /> Start New Sale
              </Button>
            </div>
            {receipt.invoicePdfUrl ? (
              <button type="button" onClick={onPrintReceipt} className="inline-flex items-center gap-2 text-sm font-medium text-emerald-800 hover:text-emerald-950">
                <Download size={15} /> Use generated invoice PDF
              </button>
            ) : null}
          </div>
        ) : (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !cartItems.length}
            className="!w-full inline-flex items-center justify-center gap-2"
          >
            <PackageCheck size={16} /> {submitting ? 'Completing sale...' : 'Create & Fulfill Order'}
          </Button>
        )}
      </div>
    </aside>
  );
};
