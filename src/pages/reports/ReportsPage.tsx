import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DateRangeFilter, DateRangeValue } from '../../components/common/DateRangeFilter';
import { DataTable } from '../../components/common/DataTable';
import { reportsRepository } from '../../repositories/reportsRepository';

const defaultRange: DateRangeValue = { rangeType: 'Month' };

export const ReportsPage: React.FC = () => {
  const [range, setRange] = useState<DateRangeValue>(defaultRange);
  const [loading, setLoading] = useState(true);
  const [bestClients, setBestClients] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [salesByShop, setSalesByShop] = useState<any[]>([]);
  const [statusSummary, setStatusSummary] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [clients, products, low, sales, status] = await Promise.all([
          reportsRepository.getBestPerformingClientsReport({ ...range, page: 1, limit: 5 }),
          reportsRepository.getTopSellingProductsReport({ ...range, page: 1, limit: 5 }),
          reportsRepository.getLowStockReport(1, 5),
          reportsRepository.getSalesByShopReport(range),
          reportsRepository.getOrderStatusSummary(range),
        ]);
        setBestClients(clients.items || []);
        setTopProducts(products.items || []);
        setLowStock(low.items || []);
        setSalesByShop(sales || []);
        setStatusSummary(status);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Reports" description="Performance and operations reports." />
        <DateRangeFilter value={range} onChange={setRange} />

        <section className="mb-6">
          <h3 className="text-lg mb-2">Best Performing Clients</h3>
          <DataTable loading={loading} data={bestClients.map((x) => ({ id: x.clientId, ...x }))} columns={[
            { header: 'Client', accessor: (x: any) => x.clientName || '-' },
            { header: 'Orders', accessor: (x: any) => x.totalOrders || 0 },
            { header: 'Sales', accessor: (x: any) => `$${(x.totalSales || 0).toFixed(2)}` },
          ]} />
        </section>

        <section className="mb-6">
          <h3 className="text-lg mb-2">Top Selling Products</h3>
          <DataTable loading={loading} data={topProducts.map((x) => ({ id: x.productId, ...x }))} columns={[
            { header: 'Product', accessor: (x: any) => x.productName || '-' },
            { header: 'SKU', accessor: (x: any) => x.sku || '-' },
            { header: 'Qty Sold', accessor: (x: any) => x.quantitySold || 0 },
          ]} />
        </section>

        <section className="mb-6">
          <h3 className="text-lg mb-2">Low Stock Products</h3>
          <DataTable loading={loading} data={lowStock.map((x) => ({ id: `${x.productId}-${x.shopId}`, ...x }))} columns={[
            { header: 'Product', accessor: (x: any) => x.productName || '-' },
            { header: 'Shop', accessor: (x: any) => x.shopName || '-' },
            { header: 'Stock', accessor: (x: any) => x.stockQuantity || 0 },
          ]} />
        </section>

        <section className="mb-6">
          <h3 className="text-lg mb-2">Sales by Shop</h3>
          <DataTable loading={loading} data={salesByShop.map((x: any) => ({ id: x.shopId, ...x }))} columns={[
            { header: 'Shop', accessor: (x: any) => x.shopName || '-' },
            { header: 'Orders', accessor: (x: any) => x.completedOrders || 0 },
            { header: 'Sales', accessor: (x: any) => `$${(x.totalSales || 0).toFixed(2)}` },
          ]} />
        </section>

        <section>
          <h3 className="text-lg mb-2">Order Status Summary</h3>
          <div className="bg-white rounded-[24px] p-6 text-sm text-gray-700">
            {loading ? 'Loading...' : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>Pending: {statusSummary?.pendingOrders || 0}</div>
                <div>Ready: {statusSummary?.readyForPickupOrders || 0}</div>
                <div>Completed: {statusSummary?.completedOrders || 0}</div>
                <div>Cancelled: {statusSummary?.cancelledOrders || 0}</div>
                <div>Unable: {statusSummary?.unableToFulfillOrders || 0}</div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
