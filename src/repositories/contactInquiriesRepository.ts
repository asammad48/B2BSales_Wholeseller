import {
  ContactInquiryDetailsDto,
  ContactInquiryListItemDto,
  ContactInquiryStatus,
  UpdateContactInquiryStatusRequestDto,
} from '../api/generated/apiClient';
import { safeApiClient as apiClient } from './apiClientSafe';

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  mobileNo: string;
  subject: string;
  status: string;
  createdAt: string;
  isRead: boolean;
}

export interface ContactInquiryDetails extends ContactInquiry {
  message: string;
  updatedAt?: string;
}

export interface ContactInquiriesResponse {
  data: ContactInquiry[];
  total: number;
  page: number;
  limit: number;
}

export interface ContactInquiryStatusUpdateBody extends UpdateContactInquiryStatusRequestDto {
  status: ContactInquiryStatus;
}

const mapInquiry = (item: ContactInquiryListItemDto): ContactInquiry => ({
  id: item.id || '',
  name: item.name || '',
  email: item.email || '',
  mobileNo: item.mobileNo || '',
  subject: item.subject || '',
  status: item.status || 'New',
  createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
  isRead: item.isRead ?? false,
});

const mapInquiryDetails = (item: ContactInquiryDetailsDto): ContactInquiryDetails => ({
  ...mapInquiry(item),
  message: item.message || '',
  updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : undefined,
});

export const contactInquiriesRepository = {
  async getContactInquiries(page: number = 1, limit: number = 10, search: string = ''): Promise<ContactInquiriesResponse> {
    const normalizedSearch = search.trim() || undefined;
    const response = await apiClient.contactInquiries(page, limit, normalizedSearch);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch contact inquiries');
    }

    return {
      data: (response.data.items || []).map(mapInquiry),
      total: response.data.totalCount || 0,
      page: response.data.pageNumber || page,
      limit: response.data.pageSize || limit,
    };
  },

  async getContactInquiryById(id: string): Promise<ContactInquiryDetails> {
    const response = await apiClient.contactInquiries2(id);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch contact inquiry details');
    }

    return mapInquiryDetails(response.data);
  },

  async updateContactInquiryStatus(id: string, body: ContactInquiryStatusUpdateBody): Promise<string> {
    const response = await apiClient.status(id, body);

    if (!response.success) {
      throw new Error(response.message || 'Failed to update contact inquiry status');
    }

    return response.data || response.message || 'Status updated';
  },
};
