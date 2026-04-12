import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { DataTable } from '../../components/common/DataTable';
import { defaultDateRangeState, DateRangeState, toDateRangeParams } from '../../utils/dateRange';
import { reportsRepository } from '../../repositories/reportsRepository';
import { motion } from 'framer-motion';

export const ReportsPage: React.FC = () => {
  const [range, setRange] = useState<DateRangeState>(defaultDateRangeState);
  const [loading, setLoading] = useState(true);
  const [bestClients, setBestClients] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [salesByShop, setSalesByShop] = useState<any[]>([]);
  const [orderStatusSummary, setOrderStatusSummary] = useState<any>({});

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = toDateRangeParams(range);
      const [bestClientsResponse, topProductsResponse, lowStockResponse, salesByShopResponse, orderStatusSummaryResponse] = await Promise.all([
        reportsRepository.getBestPerformingClientsReport({ ...params, page: 1, limit: 10 }),
        reportsRepository.getTopSellingProductsReport({ ...params, page: 1, limit: 10 }),
        reportsRepository.getLowStockReport({ ...params, page: 1, limit: 10 }),
        reportsRepository.getSalesByShopReport(params),
        reportsRepository.getOrderStatusSummary(params),
      ]);

      setBestClients(bestClientsResponse.data.map((item, index) => ({ id: item.clientId || `client-${index}`, ...item })));
      setTopProducts(topProductsResponse.data.map((item, index) => ({ id: item.productId || `product-${index}`, ...item })));
      setLowStock(lowStockResponse.data.map((item, index) => ({ id: `${item.shopId || 'shop'}-${item.productId || index}`, ...item })));
      setSalesByShop(salesByShopResponse.map((item, index) => ({ id: item.shopId || `shop-${index}`, ...item })));
      setOrderStatusSummary(orderStatusSummaryResponse || {});
    } catch (error) {
      console.error('Failed to fetch reports', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range.rangeType, range.startDate, range.endDate]);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Reports" description="Analyze clients, products, stock, sales by shop, and order status trends." />

        <DateRangeFilter value={range} onChange={setRange} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <section>
            <h2 className="text-lg font-medium mb-3">Best Performing Clients</h2>
            <DataTable
              data={bestClients}
              loading={loading}
              columns={[
                { header: 'Client', accessor: (item: any) => item.clientName || '-' },
                { header: 'Business', accessor: (item: any) => item.businessName || '-' },
                { header: 'Total Orders', accessor: (item: any) => item.totalOrders || 0 },
                { header: 'Total Sales', accessor: (item: any) => `$${(item.totalSales || 0).toFixed(2)}` },
              ]}
            />
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">Top Selling Products</h2>
            <DataTable
              data={topProducts}
              loading={loading}
              columns={[
                { header: 'Product', accessor: (item: any) => item.productName || '-' },
                { header: 'SKU', accessor: (item: any) => item.sku || '-' },
                { header: 'Qty Sold', accessor: (item: any) => item.quantitySold || 0 },
                { header: 'Sales', accessor: (item: any) => `$${(item.totalSales || 0).toFixed(2)}` },
              ]}
            />
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">Low Stock Products</h2>
            <DataTable
              data={lowStock}
              loading={loading}
              columns={[
                { header: 'Product', accessor: (item: any) => item.productName || '-' },
                { header: 'SKU', accessor: (item: any) => item.sku || '-' },
                { header: 'Shop', accessor: (item: any) => item.shopName || '-' },
                { header: 'Stock', accessor: (item: any) => item.stockQuantity || 0 },
                { header: 'Threshold', accessor: (item: any) => item.lowStockThreshold || 0 },
              ]}
            />
          </section>

          <section>
            <h2 className="text-lg font-medium mb-3">Sales by Shop</h2>
            <DataTable
              data={salesByShop}
              loading={loading}
              columns={[
                { header: 'Shop', accessor: (item: any) => item.shopName || '-' },
                { header: 'Completed Orders', accessor: (item: any) => item.completedOrders || 0 },
                { header: 'Total Sales', accessor: (item: any) => `$${(item.totalSales || 0).toFixed(2)}` },
                { header: 'Avg Order', accessor: (item: any) => `$${(item.averageOrderValue || 0).toFixed(2)}` },
              ]}
            />
          </section>

          <section className="bg-[var(--bg-surface)] rounded-[24px] p-6 border border-[var(--border-subtle)]">
            <h2 className="text-lg font-medium mb-4">Order Status Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div><span className="text-gray-400 block">Pending</span><strong>{orderStatusSummary.pendingOrders || 0}</strong></div>
              <div><span className="text-gray-400 block">Ready</span><strong>{orderStatusSummary.readyForPickupOrders || 0}</strong></div>
              <div><span className="text-gray-400 block">Completed</span><strong>{orderStatusSummary.completedOrders || 0}</strong></div>
              <div><span className="text-gray-400 block">Cancelled</span><strong>{orderStatusSummary.cancelledOrders || 0}</strong></div>
              <div><span className="text-gray-400 block">Unable</span><strong>{orderStatusSummary.unableToFulfillOrders || 0}</strong></div>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
};
