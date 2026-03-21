import {
  ClientResponseDto,
  CreateClientRequestDto,
  CurrencyLookupResponseDto,
  LanguageLookupResponseDto,
  LookupBundleResponseDto,
  LookupItemResponseDto,
} from '../api/generated/apiClient';
import { safeApiClient as apiClient } from './apiClientSafe';

export interface ClientAdmin {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone: string;
  status: string;
}

export interface ClientLookupItem {
  id: string;
  name: string;
}

export interface ClientFormLookups {
  currencies: CurrencyLookupResponseDto[];
  languages: LanguageLookupResponseDto[];
  clients: ClientLookupItem[];
}

const mapClient = (item?: ClientResponseDto): ClientAdmin => ({
  id: item?.id || '',
  name: item?.name || '',
  businessName: item?.businessName || '',
  email: item?.email || '',
  phone: item?.phone || '',
  status: item?.status || 'PendingApproval',
});

const mapClientLookup = (item: LookupItemResponseDto): ClientLookupItem => ({
  id: item.id || '',
  name: item.name || '',
});

export const clientsRepository = {
  async createClient(body: CreateClientRequestDto): Promise<ClientAdmin> {
    const response = await apiClient.clients(body);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create client');
    }

    return mapClient(response.data);
  },

  async getCreateClientLookups(): Promise<ClientFormLookups> {
    const response = await apiClient.bundle();

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch client form lookups');
    }

    const bundle: LookupBundleResponseDto = response.data;

    return {
      currencies: bundle.currencies || [],
      languages: bundle.languages || [],
      clients: (bundle.clients || []).map(mapClientLookup),
    };
  },
};
