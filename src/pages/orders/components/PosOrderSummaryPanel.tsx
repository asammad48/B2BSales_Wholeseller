import React from 'react';
import { CheckCircle2, Download, Minus, PackageCheck, Plus, Printer, ReceiptText, RotateCcw, X } from 'lucide-react';
import { Button, FormField, Input, SearchableSelect, SearchableSelectOption } from '../../../components/common/Form';
import { ClientLookupItem } from '../../../repositories/clientsRepository';
import { PosProduct, PosSerializedUnit } from '../../../repositories/posOrdersRepository';
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
  onSerializedUnitsChange: (product: PosProduct, units: PosSerializedUnit[]) => void;
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

const unitKey = (unit: PosSerializedUnit) => [unit.barcode, unit.imei1, unit.imei2].join('|');

const buildSerializedUnitLabel = (unit: PosSerializedUnit) =>
  [unit.imei1 ? `IMEI 1: ${unit.imei1}` : undefined, unit.imei2 ? `IMEI 2: ${unit.imei2}` : undefined, unit.barcode ? `Barcode: ${unit.barcode}` : undefined]
    .filter(Boolean)
    .join(' • ');

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
  onSerializedUnitsChange,
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

  return (
    <aside className="rounded-[28px] bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Receipt Summary</p>
            <h2 className="mt-2 text-2xl font-light text-gray-900">Create and fulfill in one step</h2>
            <p className="mt-2 text-sm text-gray-500">Review selected products, confirm the destination shop, and complete the sale immediately.</p>
          </div>
          {receipt ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-emerald-700">
              <CheckCircle2 size={14} /> Fulfilled
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-gray-600">
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

        <div className="rounded-[24px] border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Selected items</h3>
            <span className="text-xs text-gray-400">{cartItems.length} lines</span>
          </div>
          <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-100 bg-gray-50/40">
            {cartItems.length ? (
              cartItems.map((item) => (
                <div key={item.product.productId} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.product.productName}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.product.sku || item.product.barcode || 'POS item'}</p>
                      {item.product.barcodes.length ? (
                        <p className="mt-1 text-[11px] text-gray-400">Serialized stock available: {item.product.barcodes.length}</p>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatMoney(item.lineTotal, item.product.currencyCode)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">{formatMoney(item.product.sellingPrice, item.product.currencyCode)} each</p>
                    <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5">
                      <button
                        type="button"
                        onClick={() => onDecrementItem(item.product)}
                        disabled={submitting || Boolean(receipt)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 disabled:opacity-40"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-[28px] text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onIncrementItem(item.product)}
                        disabled={submitting || Boolean(receipt) || item.quantity >= (item.product.barcodes.length ? Math.min(item.product.quantityInHand, item.product.barcodes.length) : item.product.quantityInHand)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  {item.product.barcodes.length ? (
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-white/70 p-3">
                      <FormField label={`Serialized units (${item.selectedSerializedUnits.length}/${item.quantity})`}>
                        <SearchableSelect
                          name={`serialized-unit-${item.product.productId}`}
                          value=""
                          onChange={(value) => {
                            const matchedUnit = item.product.barcodes.find((unit) => unitKey(unit) === value);
                            if (!matchedUnit) {
                              return;
                            }

                            const existingKeys = new Set(item.selectedSerializedUnits.map(unitKey));
                            if (existingKeys.has(value) || item.selectedSerializedUnits.length >= item.quantity) {
                              return;
                            }

                            onSerializedUnitsChange(item.product, [...item.selectedSerializedUnits, matchedUnit]);
                          }}
                          placeholder="Select IMEI / barcode"
                          searchPlaceholder="Search IMEI 1, IMEI 2, or barcode"
                          disabled={submitting || Boolean(receipt) || item.selectedSerializedUnits.length >= item.quantity}
                          options={item.product.barcodes
                            .filter((unit) => !item.selectedSerializedUnits.some((selected) => unitKey(selected) === unitKey(unit)))
                            .map((unit) => ({
                              value: unitKey(unit),
                              label: buildSerializedUnitLabel(unit),
                              searchText: [unit.imei1, unit.imei2, unit.barcode].filter(Boolean).join(' '),
                            }))}
                          noResultsText={item.selectedSerializedUnits.length >= item.quantity ? 'Selected units match quantity' : 'No more serialized units available'}
                        />
                      </FormField>
                      <p className="mt-2 text-[11px] text-gray-500">
                        Select exactly {item.quantity} serialized unit{item.quantity === 1 ? '' : 's'} for this item.
                      </p>

                      <div className="mt-3 space-y-2">
                        {item.selectedSerializedUnits.length ? (
                          item.selectedSerializedUnits.map((unit, index) => (
                            <div key={`${unitKey(unit)}-${index}`} className="flex items-start justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-3 py-2">
                              <p className="text-xs text-gray-700">{buildSerializedUnitLabel(unit)}</p>
                              <button
                                type="button"
                                onClick={() => onSerializedUnitsChange(item.product, item.selectedSerializedUnits.filter((_, currentIndex) => currentIndex !== index))}
                                disabled={submitting || Boolean(receipt)}
                                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-white hover:text-gray-700 disabled:opacity-40"
                                title="Remove serialized unit"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500">No serialized units selected yet.</p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">Add products from the left panel to start a POS order.</div>
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-100 p-5 space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatMoney(receipt?.subtotal ?? subtotal, currencyCode)}</span></div>
          <div className="flex items-center justify-between text-sm text-gray-600"><span>Discount</span><span>{formatMoney(discountAmount, currencyCode)}</span></div>
          <div className="flex items-center justify-between text-sm text-gray-600"><span>Tax</span><span>{formatMoney(taxAmount, currencyCode)}</span></div>
          <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-base font-semibold text-gray-900"><span>Total</span><span>{formatMoney(grandTotal, currencyCode)}</span></div>
        </div>

        {receipt ? (
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 p-5 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Completed order</p>
              <h3 className="mt-2 text-lg font-semibold text-emerald-900">{receipt.orderNumber}</h3>
              <p className="mt-1 text-sm text-emerald-800">This sale has already been fulfilled and the receipt PDF is ready.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-2xl bg-white/80 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Status</p>
                <p className="mt-1 font-medium text-emerald-900">{receipt.status || 'Completed'}</p>
              </div>
              <div className="rounded-2xl bg-white/80 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Barcode</p>
                <p className="mt-1 font-medium text-emerald-900">{receipt.barcodeValue || 'Not provided'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button type="button" onClick={onPrintReceipt} className="!w-full inline-flex items-center justify-center gap-2">
                <Printer size={16} /> Print / Download PDF
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
