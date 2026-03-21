import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Boxes, PackageSearch, ShoppingBag, Users } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { DashboardOverview, dashboardRepository } from '../../repositories/dashboardRepository';
import { defaultDateRangeState, toDateRangeParams, DateRangeState } from '../../utils/dateRange';

const StatCard = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper?: string;
}) => (
  <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50">
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-3xl font-light text-gray-900">{value}</p>
    {helper ? <p className="mt-2 text-xs text-gray-400">{helper}</p> : null}
  </div>
);

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
const formatDate = (value?: Date | string) => value ? new Date(value).toLocaleDateString() : '—';

const PreviewCard = ({
  title,
  icon: Icon,
  children,
  action,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="bg-white rounded-[24px] shadow-sm border border-gray-50 overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-900">
        <Icon size={16} className="text-gray-400" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {action}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const [range, setRange] = useState<DateRangeState>(defaultDateRangeState);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchOverview = async () => {
      setLoading(true);
      try {
        const data = await dashboardRepository.getDashboardOverview(toDateRangeParams(range));
        if (active) {
          setOverview(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard overview', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchOverview();

    return () => {
      active = false;
    };
  }, [range.rangeType, range.startDate, range.endDate]);

  const cards = useMemo(() => {
    const summary = overview?.summary;
    return [
      { label: 'Total Clients', value: summary?.totalClients || 0 },
      { label: 'Total Sales', value: formatCurrency(summary?.totalSales || 0) },
      { label: 'Active Orders', value: summary?.activeOrders || 0 },
      { label: 'Total Products', value: summary?.totalProducts || 0 },
      { label: 'Low Stock Products', value: summary?.lowStockProducts || 0 },
      { label: 'Pending Orders', value: summary?.pendingOrders || 0 },
      { label: 'Ready for Pickup', value: summary?.readyForPickupOrders || 0 },
      { label: 'Completed Orders', value: summary?.completedOrders || 0 },
    ];
  }, [overview]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Dashboard"
          description="Track operational performance across orders, clients, stock, and inquiries."
          actions={
            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-xl bg-white text-sm text-gray-600 border border-gray-100">
                Unread notifications: <span className="font-semibold text-gray-900">{overview?.unreadNotificationsCount || 0}</span>
              </div>
              <Link to="/orders" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                View Orders
              </Link>
            </div>
          }
        />

        <DateRangeFilter value={range} onChange={setRange} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {loading ? (
            <div className="bg-white rounded-[24px] p-12 text-center text-gray-500">Loading dashboard overview...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {cards.map((card) => (
                  <div key={card.label}>
                    <StatCard label={card.label} value={card.value} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <PreviewCard title="Recent Orders" icon={ShoppingBag} action={<Link to="/orders" className="text-xs font-medium text-gray-500 hover:text-gray-900">View all</Link>}>
                  <div className="space-y-3">
                    {(overview?.recentOrders || []).slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.orderNumber || order.id}</p>
                          <p className="text-xs text-gray-400">{order.clientName || 'Unknown client'} • {order.shopName || 'Unknown shop'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(order.totalAmount || 0)}</p>
                          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                    {!(overview?.recentOrders || []).length ? <p className="text-sm text-gray-400">No recent orders available.</p> : null}
                  </div>
                </PreviewCard>

                <PreviewCard title="Recent Inquiries" icon={Bell} action={<Link to="/contact-inquiries" className="text-xs font-medium text-gray-500 hover:text-gray-900">Manage inquiries</Link>}>
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                      Unread inquiries: <span className="font-semibold text-gray-900">{overview?.summary.unreadInquiriesCount || 0}</span>
                    </div>
                    {(overview?.recentInquiries || []).slice(0, 5).map((inquiry) => (
                      <div key={inquiry.id} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{inquiry.subject || 'No subject'}</p>
                          <p className="text-xs text-gray-400">{inquiry.name || 'Unknown contact'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{inquiry.status || 'New'}</p>
                          <p className="text-xs text-gray-400">{formatDate(inquiry.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                    {!(overview?.recentInquiries || []).length ? <p className="text-sm text-gray-400">No inquiries available.</p> : null}
                  </div>
                </PreviewCard>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <PreviewCard title="Low Stock Preview" icon={PackageSearch}>
                  <div className="space-y-3">
                    {(overview?.lowStockPreview || []).slice(0, 5).map((item) => (
                      <div key={`${item.productId}-${item.shopId}`} className="rounded-2xl border border-gray-100 px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{item.productName || 'Unnamed product'}</p>
                        <p className="text-xs text-gray-400">{item.sku || 'No SKU'} • {item.shopName || 'Unknown shop'}</p>
                        <p className="mt-1 text-xs text-amber-600">Stock {item.stockQuantity || 0} / Threshold {item.lowStockThreshold || 0}</p>
                      </div>
                    ))}
                    {!(overview?.lowStockPreview || []).length ? <p className="text-sm text-gray-400">No low stock products right now.</p> : null}
                  </div>
                </PreviewCard>

                <PreviewCard title="Best Performing Clients" icon={Users}>
                  <div className="space-y-3">
                    {(overview?.bestPerformingClientsPreview || []).slice(0, 5).map((item, index) => (
                      <div key={`${item.clientId || 'client'}-${index}`} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.clientName || 'Unnamed client'}</p>
                          <p className="text-xs text-gray-400">Orders: {item.totalOrders || 0}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.totalSales || 0)}</p>
                      </div>
                    ))}
                    {!(overview?.bestPerformingClientsPreview || []).length ? <p className="text-sm text-gray-400">No client performance data available.</p> : null}
                  </div>
                </PreviewCard>

                <PreviewCard title="Top Selling Products" icon={Boxes}>
                  <div className="space-y-3">
                    {(overview?.topSellingProductsPreview || []).slice(0, 5).map((item, index) => (
                      <div key={`${item.productId || 'product'}-${index}`} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.productName || 'Unnamed product'}</p>
                          <p className="text-xs text-gray-400">Qty sold: {item.totalQuantitySold || 0}</p>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.totalSales || 0)}</p>
                      </div>
                    ))}
                    {!(overview?.topSellingProductsPreview || []).length ? <p className="text-sm text-gray-400">No product performance data available.</p> : null}
                  </div>
                </PreviewCard>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};
