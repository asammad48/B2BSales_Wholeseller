import { safeApiClient as apiClient } from './apiClientSafe';
import { RangeType } from '../api/generated/apiClient';

export interface DateRangeParams {
  rangeType: RangeType;
  startDate?: Date;
  endDate?: Date;
}

export interface DashboardSummary {
  totalClients: number;
  totalSales: number;
  activeOrders: number;
  rangeType?: RangeType;
  startDate?: Date;
  endDate?: Date;
}

export const dashboardRepository = {
  async getDashboardSummary(params: DateRangeParams): Promise<DashboardSummary> {
    const response = await apiClient.summary2(params.rangeType, params.startDate, params.endDate);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch dashboard summary');
    }

    return {
      totalClients: response.data.totalClients || 0,
      totalSales: response.data.totalSales || 0,
      activeOrders: response.data.activeOrders || 0,
      rangeType: response.data.rangeType,
      startDate: response.data.startDate,
      endDate: response.data.endDate,
    };
  },
};
