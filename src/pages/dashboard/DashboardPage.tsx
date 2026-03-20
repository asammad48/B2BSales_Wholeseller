import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DateRangeFilter } from '../../components/common/DateRangeFilter';
import { dashboardRepository, DashboardSummary } from '../../repositories/dashboardRepository';
import { defaultDateRangeState, toDateRangeParams, DateRangeState } from '../../utils/dateRange';
import { motion } from 'framer-motion';

const StatCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-50">
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
    <p className="text-3xl font-light text-gray-900">{value}</p>
  </div>
);

export const DashboardPage: React.FC = () => {
  const [range, setRange] = useState<DateRangeState>(defaultDateRangeState);
  const [summary, setSummary] = useState<DashboardSummary>({ totalClients: 0, totalSales: 0, activeOrders: 0 });
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await dashboardRepository.getDashboardSummary(toDateRangeParams(range));
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch dashboard summary', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [range.rangeType, range.startDate, range.endDate]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Dashboard"
          description="Track key wholesale metrics and navigate to reports."
          actions={
            <Link to="/reports" className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
              View Reports
            </Link>
          }
        />

        <DateRangeFilter value={range} onChange={setRange} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {loading ? (
            <div className="bg-white rounded-[24px] p-12 text-center text-gray-500">Loading dashboard summary...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard label="Total Clients" value={summary.totalClients} />
              <StatCard label="Total Sales" value={`$${summary.totalSales.toFixed(2)}`} />
              <StatCard label="Active Orders" value={summary.activeOrders} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
