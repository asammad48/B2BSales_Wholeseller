import { safeApiClient as apiClient } from './apiClientSafe';
import {
  BestPerformingClientReportItemDto,
  LowStockReportItemDto,
  OrderStatusSummaryDto,
  RangeType,
  SalesByShopReportItemDto,
  TopSellingProductReportItemDto,
} from '../api/generated/apiClient';

export interface DateRangeReportParams {
  rangeType: RangeType;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PagedReportResponse<T> {
  data: T[];
  total: number;
}

export const reportsRepository = {
  async getBestPerformingClientsReport(params: DateRangeReportParams): Promise<PagedReportResponse<BestPerformingClientReportItemDto>> {
    const response = await apiClient.bestPerforming(
      params.rangeType,
      params.startDate,
      params.endDate,
      params.page || 1,
      params.limit || 10,
      params.search,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch best performing clients report');
    }

    return {
      data: response.data.items || [],
      total: response.data.totalCount || 0,
    };
  },

  async getTopSellingProductsReport(params: DateRangeReportParams): Promise<PagedReportResponse<TopSellingProductReportItemDto>> {
    const response = await apiClient.topSelling(
      params.rangeType,
      params.startDate,
      params.endDate,
      params.page || 1,
      params.limit || 10,
      params.search,
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch top selling products report');
    }

    return {
      data: response.data.items || [],
      total: response.data.totalCount || 0,
    };
  },

  async getLowStockReport(params: DateRangeReportParams): Promise<PagedReportResponse<LowStockReportItemDto>> {
    const response = await apiClient.lowStock(params.page || 1, params.limit || 10, params.search);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch low stock report');
    }

    return {
      data: response.data.items || [],
      total: response.data.totalCount || 0,
    };
  },

  async getSalesByShopReport(params: Omit<DateRangeReportParams, 'page' | 'limit' | 'search'>): Promise<SalesByShopReportItemDto[]> {
    const response = await apiClient.byShop(params.rangeType, params.startDate, params.endDate);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch sales by shop report');
    }

    return response.data || [];
  },

  async getOrderStatusSummary(params: Omit<DateRangeReportParams, 'page' | 'limit' | 'search'>): Promise<OrderStatusSummaryDto> {
    const response = await apiClient.statusSummary(params.rangeType, params.startDate, params.endDate);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch order status summary');
    }

    return response.data;
  },
};
