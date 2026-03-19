import { safeApiClient as apiClient } from './apiClientSafe';
import { productsRepository } from './productsRepository';

export interface LookupOption {
  id: string;
  name: string;
  secondaryText?: string;
}

export interface InventoryFormLookups {
  products: LookupOption[];
  shops: LookupOption[];
}

export const lookupsRepository = {
  async getInventoryFormLookups(): Promise<InventoryFormLookups> {
    const [bundleResponse, productsResponse] = await Promise.all([
      apiClient.bundle(),
      productsRepository.getProducts(1, 500, ''),
    ]);

    if (!bundleResponse.success || !bundleResponse.data) {
      throw new Error(bundleResponse.message || 'Failed to fetch lookup bundle');
    }

    return {
      products: productsResponse.data.map((product) => ({
        id: product.id,
        name: product.name,
        secondaryText: [product.sku, product.brandName, product.modelName].filter(Boolean).join(' • '),
      })),
      shops: (bundleResponse.data.shops || []).map((shop) => ({
        id: shop.id || '',
        name: shop.name || '',
      })).filter((shop) => shop.id && shop.name),
    };
  },
};
