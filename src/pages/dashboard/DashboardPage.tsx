import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DateRangeFilter, DateRangeValue } from '../../components/common/DateRangeFilter';
import { dashboardRepository, DashboardSummary } from '../../repositories/dashboardRepository';

const defaultRange: DateRangeValue = { rangeType: 'Month' };

export const DashboardPage: React.FC = () => {
  const [range, setRange] = useState<DateRangeValue>(defaultRange);
  const [summary, setSummary] = useState<DashboardSummary>({ totalClients: 0, totalSales: 0, activeOrders: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const data = await dashboardRepository.getDashboardSummary(range);
        setSummary(data);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [range]);

  const cards = [
    { label: 'Total Clients', value: summary.totalClients },
    { label: 'Total Sales', value: `$${summary.totalSales.toFixed(2)}` },
    { label: 'Active Orders', value: summary.activeOrders },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Dashboard" description="Overview of clients, sales, and active orders." />
        <DateRangeFilter value={range} onChange={setRange} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-[24px] p-6">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{card.label}</p>
              <p className="text-3xl font-light text-gray-900 mt-3">{loading ? '...' : card.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
