import { RangeType } from '../api/generated/apiClient';
import { safeApiClient as apiClient } from './apiClientSafe';

interface DateRangeParams {
  rangeType: RangeType;
  startDate?: string;
  endDate?: string;
}

interface ListParams extends DateRangeParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const reportsRepository = {
  async getBestPerformingClientsReport(params: ListParams) {
    const response = await apiClient.bestPerforming(
      params.rangeType,
      params.startDate ? new Date(params.startDate) : undefined,
      params.endDate ? new Date(params.endDate) : undefined,
      params.page || 1,
      params.limit || 10,
      params.search?.trim() || undefined
    );
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to fetch best performing clients report');
    return response.data;
  },

  async getTopSellingProductsReport(params: ListParams) {
    const response = await apiClient.topSelling(
      params.rangeType,
      params.startDate ? new Date(params.startDate) : undefined,
      params.endDate ? new Date(params.endDate) : undefined,
      params.page || 1,
      params.limit || 10,
      params.search?.trim() || undefined
    );
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to fetch top selling products report');
    return response.data;
  },

  async getLowStockReport(page: number = 1, limit: number = 10, search: string = '') {
    const response = await apiClient.lowStock(page, limit, search.trim() || undefined);
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to fetch low stock report');
    return response.data;
  },

  async getSalesByShopReport(params: DateRangeParams) {
    const response = await apiClient.byShop(
      params.rangeType,
      params.startDate ? new Date(params.startDate) : undefined,
      params.endDate ? new Date(params.endDate) : undefined
    );
    if (!response.success) throw new Error(response.message || 'Failed to fetch sales by shop report');
    return response.data || [];
  },

  async getOrderStatusSummary(params: DateRangeParams) {
    const response = await apiClient.statusSummary(
      params.rangeType,
      params.startDate ? new Date(params.startDate) : undefined,
      params.endDate ? new Date(params.endDate) : undefined
    );
    if (!response.success || !response.data) throw new Error(response.message || 'Failed to fetch order status summary report');
    return response.data;
  },
};
