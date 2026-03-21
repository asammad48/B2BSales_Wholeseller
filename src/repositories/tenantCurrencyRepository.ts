import { CurrencyLookupResponseDto } from '../api/generated/apiClient';
import { adminHttp, getApiErrorMessage, unwrapApiResponse } from './adminHttp';
import { lookupsRepository } from './lookupsRepository';

export interface TenantExchangeRate {
  id: string;
  fromCurrencyId: string;
  fromCurrencyCode: string;
  toCurrencyId: string;
  toCurrencyCode: string;
  rate: number;
  updatedAt?: string;
}

export interface TenantCurrencySettings {
  defaultSellingCurrencyId?: string;
  defaultSellingCurrencyCode?: string;
  availableCurrencies: CurrencyLookupResponseDto[];
  exchangeRates: TenantExchangeRate[];
}

export interface UpdateDefaultSellingCurrencyBody {
  currencyId: string;
}

export interface UpsertTenantExchangeRateBody {
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
}

interface TenantCurrencySettingsResponse {
  defaultSellingCurrencyId?: string;
  defaultSellingCurrencyCode?: string;
  currencies?: CurrencyLookupResponseDto[];
  availableCurrencies?: CurrencyLookupResponseDto[];
  exchangeRates?: Array<{
    id?: string;
    fromCurrencyId?: string;
    fromCurrencyCode?: string;
    toCurrencyId?: string;
    toCurrencyCode?: string;
    rate?: number;
    updatedAt?: string;
  }>;
}

const normalizeExchangeRate = (rate: TenantCurrencySettingsResponse['exchangeRates'][number], fallbackIndex: number): TenantExchangeRate => ({
  id: rate?.id || `${rate?.fromCurrencyId || 'from'}-${rate?.toCurrencyId || 'to'}-${fallbackIndex}`,
  fromCurrencyId: rate?.fromCurrencyId || '',
  fromCurrencyCode: rate?.fromCurrencyCode || '',
  toCurrencyId: rate?.toCurrencyId || '',
  toCurrencyCode: rate?.toCurrencyCode || '',
  rate: Number(rate?.rate || 0),
  updatedAt: rate?.updatedAt,
});

export const tenantCurrencyRepository = {
  async getTenantCurrencySettings(): Promise<TenantCurrencySettings> {
    try {
      const response = await adminHttp.get('/api/tenant-currency/settings');
      const data = unwrapApiResponse<TenantCurrencySettingsResponse>(response.data);
      const lookupBundle = await lookupsRepository.getBundle();
      const availableCurrencies = data.availableCurrencies || data.currencies || lookupBundle.currencies || [];

      return {
        defaultSellingCurrencyId: data.defaultSellingCurrencyId,
        defaultSellingCurrencyCode: data.defaultSellingCurrencyCode,
        availableCurrencies,
        exchangeRates: (data.exchangeRates || []).map(normalizeExchangeRate),
      };
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch tenant currency settings'));
    }
  },

  async updateDefaultSellingCurrency(body: UpdateDefaultSellingCurrencyBody): Promise<void> {
    try {
      const response = await adminHttp.put('/api/tenant-currency/default-selling-currency', body);
      unwrapApiResponse<unknown>(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update default selling currency'));
    }
  },

  async upsertTenantExchangeRate(body: UpsertTenantExchangeRateBody): Promise<void> {
    try {
      const response = await adminHttp.post('/api/tenant-currency/exchange-rates', body);
      unwrapApiResponse<unknown>(response.data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to save exchange rate'));
    }
  },
};
