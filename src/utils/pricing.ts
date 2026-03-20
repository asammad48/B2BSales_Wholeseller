import { PricingMode } from '../api/generated/apiClient';

export const isPercentageBasedPricingMode = (pricingMode?: PricingMode) => pricingMode === 'PercentageBased';

export const normalizeMarkupValue = (pricingMode: PricingMode, markup?: number) => (
  isPercentageBasedPricingMode(pricingMode) ? markup ?? 0 : undefined
);
