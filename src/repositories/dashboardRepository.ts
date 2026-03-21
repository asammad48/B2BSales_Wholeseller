import {
  BestPerformingClientReportItemDto,
  DashboardSummaryMetricsDto,
  InquiryPreviewDto,
  LowStockReportItemDto,
  OrderListItemResponseDto,
  RangeType,
  TopSellingProductReportItemDto,
} from '../api/generated/apiClient';
import { safeApiClient as apiClient } from './apiClientSafe';

export interface DateRangeParams {
  rangeType: RangeType;
  startDate?: Date;
  endDate?: Date;
}

export interface DashboardSummary {
  totalClients: number;
  totalSales: number;
  activeOrders: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingOrders: number;
  readyForPickupOrders: number;
  completedOrders: number;
  unreadInquiriesCount: number;
}

export interface DashboardOverview {
  summary: DashboardSummary;
  recentOrders: OrderListItemResponseDto[];
  recentInquiries: InquiryPreviewDto[];
  lowStockPreview: LowStockReportItemDto[];
  bestPerformingClientsPreview: BestPerformingClientReportItemDto[];
  topSellingProductsPreview: TopSellingProductReportItemDto[];
  unreadNotificationsCount: number;
}

const mapSummary = (summary?: DashboardSummaryMetricsDto): DashboardSummary => ({
  totalClients: summary?.totalClients || 0,
  totalSales: summary?.totalSales || 0,
  activeOrders: summary?.activeOrders || 0,
  totalProducts: summary?.totalProducts || 0,
  lowStockProducts: summary?.lowStockProducts || 0,
  pendingOrders: summary?.pendingOrders || summary?.orderStatusSummary?.pendingOrders || 0,
  readyForPickupOrders: summary?.readyForPickupOrders || summary?.orderStatusSummary?.readyForPickupOrders || 0,
  completedOrders: summary?.completedOrders || summary?.orderStatusSummary?.completedOrders || 0,
  unreadInquiriesCount: summary?.unreadInquiriesCount || 0,
});

export const dashboardRepository = {
  async getDashboardOverview(params: DateRangeParams): Promise<DashboardOverview> {
    const response = await apiClient.overview(params.rangeType, params.startDate, params.endDate);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch dashboard overview');
    }

    return {
      summary: mapSummary(response.data.summary),
      recentOrders: response.data.recentOrders || [],
      recentInquiries: response.data.recentInquiries || [],
      lowStockPreview: response.data.lowStockPreview || [],
      bestPerformingClientsPreview: response.data.bestPerformingClientsPreview || [],
      topSellingProductsPreview: response.data.topSellingProductsPreview || [],
      unreadNotificationsCount: response.data.unreadNotificationsCount || 0,
    };
  },

  async getDashboardSummary(params: DateRangeParams): Promise<DashboardSummary> {
    const overview = await this.getDashboardOverview(params);
    return overview.summary;
  },
};
