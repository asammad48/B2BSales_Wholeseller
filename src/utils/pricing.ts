import { PricingMode } from '../api/generated/apiClient';

export const requiresMarkup = (pricingMode?: PricingMode | null) => pricingMode === 'PercentageBased';
