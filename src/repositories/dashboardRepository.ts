import { RangeType } from '../api/generated/apiClient';
import { safeApiClient as apiClient } from './apiClientSafe';

export interface DateRangeParams {
  rangeType: RangeType;
  startDate?: string;
  endDate?: string;
}

export interface DashboardSummary {
  totalClients: number;
  totalSales: number;
  activeOrders: number;
}

export const dashboardRepository = {
  async getDashboardSummary(params: DateRangeParams): Promise<DashboardSummary> {
    const response = await apiClient.summary2(
      params.rangeType,
      params.startDate ? new Date(params.startDate) : undefined,
      params.endDate ? new Date(params.endDate) : undefined
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch dashboard summary');
    }

    return {
      totalClients: response.data.totalClients || 0,
      totalSales: response.data.totalSales || 0,
      activeOrders: response.data.activeOrders || 0,
    };
  },
};
