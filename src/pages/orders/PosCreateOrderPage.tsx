import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { clientsRepository, ClientLookupItem } from '../../repositories/clientsRepository';
import { ordersRepository } from '../../repositories/ordersRepository';
import { posOrdersRepository, PosProduct } from '../../repositories/posOrdersRepository';
import { shopsRepository, ShopLookupItem } from '../../repositories/shopsRepository';
import { PosOrderSummaryPanel } from './components/PosOrderSummaryPanel';
import { PosProductSelectorPanel } from './components/PosProductSelectorPanel';

export interface PosCartItem {
  product: PosProduct;
  quantity: number;
  lineTotal: number;
  selectedBarcodes: string[];
}

export interface PosOrderReceipt {
  orderId: string;
  orderNumber: string;
  status: string;
  completedAt?: string;
  shopName: string;
  clientName?: string;
  currencyCode: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  invoicePdfUrl?: string;
  barcodeValue: string;
}

const buildCartItems = (cart: Record<string, PosCartItem>): PosCartItem[] =>
  Object.values(cart).map((item) => ({
    ...item,
    lineTotal: item.product.sellingPrice * item.quantity,
  }));

export const PosCreateOrderPage: React.FC = () => {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [search, setSearch] = useState('');

  const [shops, setShops] = useState<ShopLookupItem[]>([]);
  const [clients, setClients] = useState<ClientLookupItem[]>([]);
  const [lookupsLoading, setLookupsLoading] = useState(true);

  const [shopId, setShopId] = useState('');
  const [clientId, setClientId] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<Record<string, PosCartItem>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [receipt, setReceipt] = useState<PosOrderReceipt | null>(null);

  useEffect(() => {
    const loadLookups = async () => {
      setLookupsLoading(true);
      try {
        const [shopsLookup, clientLookups] = await Promise.all([
          shopsRepository.getShopsLookup(),
          clientsRepository.getCreateClientLookups(),
        ]);

        setShops(shopsLookup);
        setClients(clientLookups.clients);
        if (!shopId && shopsLookup[0]?.id) {
          setShopId(shopsLookup[0].id);
        }
      } catch (error) {
        console.error('Failed to load POS lookups', error);
        setSubmitError(error instanceof Error ? error.message : 'Failed to load POS lookups');
      } finally {
        setLookupsLoading(false);
      }
    };

    loadLookups();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setProductsLoading(true);
      setProductsError('');
      try {
        const response = await posOrdersRepository.getPosProducts({
          shopId: shopId || undefined,
          limit: 10000,
          search,
        });
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to load POS products', error);
        setProductsError(error instanceof Error ? error.message : 'Failed to load POS products');
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [search, shopId]);

  const cartItems = useMemo(() => buildCartItems(cart), [cart]);
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.lineTotal, 0), [cartItems]);

  const changeQuantity = (product: PosProduct, delta: number) => {
    if (receipt) {
      return;
    }

    setCart((current) => {
      const existing = current[product.productId];
      const currentQuantity = existing?.quantity || 0;
      const maxQuantity = product.barcodes.length > 0 ? product.barcodes.length : product.quantityInHand;
      const nextQuantity = Math.max(0, Math.min(maxQuantity, currentQuantity + delta));

      if (nextQuantity <= 0) {
        const { [product.productId]: _removed, ...rest } = current;
        return rest;
      }

      return {
        ...current,
        [product.productId]: {
          product,
          quantity: nextQuantity,
          lineTotal: product.sellingPrice * nextQuantity,
          selectedBarcodes: (existing?.selectedBarcodes || []).slice(0, nextQuantity),
        },
      };
    });
  };

  const incrementItem = (product: PosProduct) => changeQuantity(product, 1);
  const decrementItem = (product: PosProduct) => changeQuantity(product, -1);

  const handleShopChange = (value: string) => {
    setShopId(value);
    if (!receipt) {
      setCart({});
      setSubmitError('');
    }
  };

  const resetSale = () => {
    setCart({});
    setNotes('');
    setClientId('');
    setReceipt(null);
    setSubmitError('');
  };

  const updateSerializedSelections = (productId: string, selectedBarcodes: string[]) => {
    setCart((current) => {
      const existing = current[productId];
      if (!existing) {
        return current;
      }

      return {
        ...current,
        [productId]: {
          ...existing,
          selectedBarcodes: selectedBarcodes.slice(0, existing.quantity),
        },
      };
    });
  };

  const handleSubmit = async () => {
    if (!shopId) {
      setSubmitError('Shop is required to create a POS order.');
      return;
    }

    if (!cartItems.length) {
      setSubmitError('Add at least one stocked product before creating the order.');
      return;
    }

    const serializedItemMissingSelection = cartItems.find(
      (item) => item.product.barcodes.length > 0 && item.selectedBarcodes.filter(Boolean).length !== item.quantity
    );

    if (serializedItemMissingSelection) {
      setSubmitError(`Select ${serializedItemMissingSelection.quantity} IMEI/barcode entr${serializedItemMissingSelection.quantity === 1 ? 'y' : 'ies'} for ${serializedItemMissingSelection.product.productName}.`);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await posOrdersRepository.createPosOrder({
        shopId,
        clientId: clientId || undefined,
        notes: notes.trim() || undefined,
        items: cartItems.map((item) => ({
          productId: item.product.productId,
          quantity: item.quantity,
          barcodes: item.product.barcodes.length > 0 ? item.selectedBarcodes.filter(Boolean) : undefined,
        })),
      });

      setReceipt({
        orderId: response.orderId || '',
        orderNumber: response.orderNumber || '',
        status: response.status || 'Completed',
        completedAt: response.completedAt ? new Date(response.completedAt).toISOString() : undefined,
        shopName: response.shopName || '',
        clientName: response.clientName,
        currencyCode: response.currencyCode || cartItems[0]?.product.currencyCode || '',
        subtotal: response.subtotal || subtotal,
        discountAmount: response.discountAmount || 0,
        taxAmount: response.taxAmount || 0,
        totalAmount: response.totalAmount || subtotal,
        invoicePdfUrl: response.invoicePdfUrl,
        barcodeValue: response.barcodeValue || '',
      });
    } catch (error) {
      console.error('Failed to create POS order', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create POS order');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!receipt?.orderId) {
      return;
    }

    try {
      const { blob, fileName } = await ordersRepository.downloadOrderInvoicePdf(receipt.orderId);
      const blobUrl = URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank', 'noopener,noreferrer');

      if (!printWindow) {
        const anchor = document.createElement('a');
        anchor.href = blobUrl;
        anchor.download = fileName;
        anchor.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (error) {
      console.error('Failed to download POS invoice PDF', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to download receipt PDF');
    }
  };

  const total = receipt?.totalAmount ?? subtotal;

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          title="POS Order"
          description="Use the dedicated POS page to sell stocked products, fulfill on create, and print the completed receipt PDF."
          actions={
            <Link to="/orders" className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800">
              <ArrowLeft size={16} /> Back to Orders
            </Link>
          }
        />

        {(submitError || productsError) ? (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{submitError || productsError}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.25fr)_420px]">
          <PosProductSelectorPanel
            loading={productsLoading || lookupsLoading}
            products={products}
            search={search}
            onSearchChange={setSearch}
            quantities={Object.fromEntries(cartItems.map((item) => [item.product.productId, item.quantity]))}
            onIncrement={incrementItem}
            onDecrement={decrementItem}
            disabled={Boolean(receipt)}
          />

          <PosOrderSummaryPanel
            cartItems={cartItems}
            subtotal={subtotal}
            total={total}
            shopId={shopId}
            onShopChange={handleShopChange}
            shops={shops}
            clientId={clientId}
            onClientChange={setClientId}
            clients={clients}
            notes={notes}
            onNotesChange={setNotes}
            onIncrementItem={incrementItem}
            onDecrementItem={decrementItem}
            onSerializedSelectionChange={updateSerializedSelections}
            onSubmit={handleSubmit}
            submitting={submitting || lookupsLoading}
            receipt={receipt}
            onPrintReceipt={handlePrintReceipt}
            onStartNewSale={resetSale}
          />
        </div>
      </div>
    </div>
  );
};

export default PosCreateOrderPage;
