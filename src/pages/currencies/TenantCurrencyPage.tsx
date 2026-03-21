import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw, Save } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { Button, FormField, Input, SearchableSelect, SearchableSelectOption } from '../../components/common/Form';
import { TenantCurrencySettings, tenantCurrencyRepository } from '../../repositories/tenantCurrencyRepository';

const mapCurrencyOptions = (currencies: TenantCurrencySettings['availableCurrencies']): SearchableSelectOption[] =>
  currencies
    .filter((item) => item.id && item.name)
    .map((item) => ({
      value: item.id || '',
      label: item.code ? `${item.name || 'Unnamed currency'} (${item.code})` : (item.name || 'Unnamed currency'),
      searchText: [item.code, item.symbol].filter(Boolean).join(' '),
    }));

interface ExchangeRateRow {
  id: string;
  pair: string;
  rate: number;
  lastUpdated: string;
}

export const TenantCurrencyPage: React.FC = () => {
  const [settings, setSettings] = useState<TenantCurrencySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingDefault, setSavingDefault] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [defaultSellingCurrencyId, setDefaultSellingCurrencyId] = useState('');
  const [fromCurrencyId, setFromCurrencyId] = useState('');
  const [toCurrencyId, setToCurrencyId] = useState('');
  const [rate, setRate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    setFormError(null);
    try {
      const response = await tenantCurrencyRepository.getTenantCurrencySettings();
      setSettings(response);
      setDefaultSellingCurrencyId(response.defaultSellingCurrencyId || '');
    } catch (error) {
      console.error('Failed to load tenant currency settings', error);
      setFormError(error instanceof Error ? error.message : 'Failed to load tenant currency settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const currencyOptions = useMemo(() => mapCurrencyOptions(settings?.availableCurrencies || []), [settings?.availableCurrencies]);

  const handleSaveDefaultCurrency = async () => {
    if (!defaultSellingCurrencyId) {
      setFormError('Default selling currency is required.');
      return;
    }

    setSavingDefault(true);
    setFormError(null);
    try {
      await tenantCurrencyRepository.updateDefaultSellingCurrency({ currencyId: defaultSellingCurrencyId });
      await fetchSettings();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to update default selling currency');
    } finally {
      setSavingDefault(false);
    }
  };

  const handleSaveExchangeRate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const numericRate = Number(rate);
    if (!fromCurrencyId || !toCurrencyId) {
      setFormError('From currency and to currency are required.');
      return;
    }

    if (numericRate <= 0) {
      setFormError('Exchange rate must be greater than zero.');
      return;
    }

    setSavingRate(true);
    setFormError(null);
    try {
      await tenantCurrencyRepository.upsertTenantExchangeRate({
        fromCurrencyId,
        toCurrencyId,
        rate: numericRate,
      });
      setRate('');
      await fetchSettings();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to save exchange rate');
    } finally {
      setSavingRate(false);
    }
  };

  const exchangeRateRows: ExchangeRateRow[] = (settings?.exchangeRates || []).map((item) => ({
    id: item.id,
    pair: `${item.fromCurrencyCode} → ${item.toCurrencyCode}`,
    rate: item.rate,
    lastUpdated: item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—',
  }));

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Currencies"
          description="Manage tenant selling currency settings and exchange rates without changing the current admin layout."
          actions={
            <button
              type="button"
              onClick={fetchSettings}
              className="bg-white text-gray-700 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium border border-gray-100 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          }
        />

        {formError ? (
          <div className="rounded-[24px] border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">{formError}</div>
        ) : null}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-6">
            <div className="bg-white rounded-[24px] border border-gray-50 p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Default selling currency</h2>
                <p className="mt-1 text-sm text-gray-400">Choose the tenant currency used as the selling context for products.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
                <FormField label="Currency">
                  <SearchableSelect
                    name="defaultSellingCurrencyId"
                    value={defaultSellingCurrencyId}
                    onChange={setDefaultSellingCurrencyId}
                    options={currencyOptions}
                    placeholder="Select default selling currency"
                    searchPlaceholder="Search currencies"
                    required
                    disabled={loading}
                  />
                </FormField>
                <button
                  type="button"
                  onClick={handleSaveDefaultCurrency}
                  disabled={savingDefault || loading}
                  className="h-[50px] px-5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2 justify-center"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  <Save size={16} /> {savingDefault ? 'Saving...' : 'Save'}
                </button>
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                Current default selling currency: <span className="font-medium text-gray-900">{settings?.defaultSellingCurrencyCode || 'Not set'}</span>
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-gray-50 p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-medium text-gray-900">Exchange rates</h2>
                <p className="mt-1 text-sm text-gray-400">Add or update a tenant exchange rate for the product pricing flow.</p>
              </div>
              <DataTable
                data={exchangeRateRows}
                loading={loading}
                columns={[
                  { header: 'Currency Pair', accessor: 'pair' },
                  { header: 'Rate', accessor: (item: ExchangeRateRow) => <span className="font-medium text-gray-900">{item.rate.toFixed(6)}</span> },
                  { header: 'Updated', accessor: 'lastUpdated' },
                ]}
              />
            </div>
          </div>

          <div className="bg-white rounded-[24px] border border-gray-50 p-6 shadow-sm h-fit">
            <div className="mb-5">
              <h2 className="text-lg font-medium text-gray-900">Add or update exchange rate</h2>
              <p className="mt-1 text-sm text-gray-400">Use the current form styling to maintain the existing admin UX.</p>
            </div>

            <form onSubmit={handleSaveExchangeRate} className="space-y-4">
              <FormField label="From Currency">
                <SearchableSelect
                  name="fromCurrencyId"
                  value={fromCurrencyId}
                  onChange={setFromCurrencyId}
                  options={currencyOptions}
                  placeholder="Select source currency"
                  searchPlaceholder="Search currencies"
                  required
                />
              </FormField>
              <FormField label="To Currency">
                <SearchableSelect
                  name="toCurrencyId"
                  value={toCurrencyId}
                  onChange={setToCurrencyId}
                  options={currencyOptions}
                  placeholder="Select target currency"
                  searchPlaceholder="Search currencies"
                  required
                />
              </FormField>
              <FormField label="Rate">
                <Input
                  name="rate"
                  type="number"
                  min="0.000001"
                  step="0.000001"
                  value={rate}
                  onChange={(event) => setRate(event.target.value)}
                  placeholder="Enter rate"
                  required
                />
              </FormField>
              <Button type="submit" disabled={savingRate || loading} style={{ backgroundColor: 'var(--primary-color)' }}>
                {savingRate ? 'Saving exchange rate...' : 'Save exchange rate'}
              </Button>
            </form>

            <div className="mt-6 rounded-2xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">Available currencies</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {currencyOptions.map((option) => (
                  <span key={option.value} className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs text-gray-600 border border-gray-100">
                    {option.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
