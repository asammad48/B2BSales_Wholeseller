import { useEffect, useMemo, useState } from 'react';
import { CurrencyLookupResponseDto, PricingMode } from '../api/generated/apiClient';
import { TenantExchangeRate } from '../repositories/tenantCurrencyRepository';

interface UseProductPricingOptions {
  currencies: CurrencyLookupResponseDto[];
  exchangeRates: TenantExchangeRate[];
  defaultSellingCurrencyId?: string;
  initialBaseCurrencyId?: string;
  initialBasePrice?: number;
  initialPricingMode?: PricingMode;
  initialSellingPrice?: number;
  initialMarkupPercentage?: number;
}

const roundMoney = (value: number) => Number.isFinite(value) ? Number(value.toFixed(2)) : 0;

const findRate = (exchangeRates: TenantExchangeRate[], fromCurrencyId?: string, toCurrencyId?: string) => {
  if (!fromCurrencyId || !toCurrencyId) {
    return undefined;
  }

  if (fromCurrencyId === toCurrencyId) {
    return 1;
  }

  const direct = exchangeRates.find((item) => item.fromCurrencyId === fromCurrencyId && item.toCurrencyId === toCurrencyId);
  if (direct?.rate) {
    return direct.rate;
  }

  const inverse = exchangeRates.find((item) => item.fromCurrencyId === toCurrencyId && item.toCurrencyId === fromCurrencyId);
  if (inverse?.rate) {
    return inverse.rate > 0 ? 1 / inverse.rate : undefined;
  }

  return undefined;
};

export const useProductPricing = ({
  currencies,
  exchangeRates,
  defaultSellingCurrencyId,
  initialBaseCurrencyId,
  initialBasePrice = 0,
  initialPricingMode = 'Direct',
  initialSellingPrice = 0,
  initialMarkupPercentage = 0,
}: UseProductPricingOptions) => {
  const [baseCurrencyId, setBaseCurrencyId] = useState(initialBaseCurrencyId || defaultSellingCurrencyId || '');
  const [basePrice, setBasePrice] = useState(initialBasePrice);
  const [pricingMode, setPricingMode] = useState<PricingMode>(initialPricingMode);
  const [sellingPrice, setSellingPrice] = useState(initialSellingPrice);
  const [markupPercentage, setMarkupPercentage] = useState(initialMarkupPercentage);

  useEffect(() => {
    if (!baseCurrencyId && defaultSellingCurrencyId) {
      setBaseCurrencyId(defaultSellingCurrencyId);
    }
  }, [baseCurrencyId, defaultSellingCurrencyId]);

  const conversionRate = useMemo(
    () => findRate(exchangeRates, baseCurrencyId, defaultSellingCurrencyId),
    [exchangeRates, baseCurrencyId, defaultSellingCurrencyId]
  );

  const convertedAmount = useMemo(() => {
    if (!defaultSellingCurrencyId) {
      return 0;
    }

    if (baseCurrencyId === defaultSellingCurrencyId) {
      return roundMoney(basePrice);
    }

    if (!conversionRate) {
      return 0;
    }

    return roundMoney(basePrice * conversionRate);
  }, [baseCurrencyId, basePrice, conversionRate, defaultSellingCurrencyId]);

  const computedSellingPrice = useMemo(() => {
    if (pricingMode !== 'PercentageBased') {
      return roundMoney(sellingPrice);
    }

    return roundMoney(convertedAmount * (1 + markupPercentage / 100));
  }, [convertedAmount, markupPercentage, pricingMode, sellingPrice]);

  useEffect(() => {
    if (pricingMode === 'PercentageBased') {
      setSellingPrice(computedSellingPrice);
    }
  }, [computedSellingPrice, pricingMode]);

  const defaultSellingCurrency = useMemo(
    () => currencies.find((currency) => currency.id === defaultSellingCurrencyId),
    [currencies, defaultSellingCurrencyId]
  );

  const baseCurrency = useMemo(
    () => currencies.find((currency) => currency.id === baseCurrencyId),
    [currencies, baseCurrencyId]
  );

  const conversionMissing = Boolean(baseCurrencyId && defaultSellingCurrencyId && baseCurrencyId !== defaultSellingCurrencyId && !conversionRate);

  return {
    baseCurrencyId,
    setBaseCurrencyId,
    basePrice,
    setBasePrice,
    pricingMode,
    setPricingMode,
    sellingPrice,
    setSellingPrice,
    markupPercentage,
    setMarkupPercentage,
    convertedAmount,
    computedSellingPrice,
    conversionRate,
    conversionMissing,
    baseCurrency,
    defaultSellingCurrency,
  };
};
