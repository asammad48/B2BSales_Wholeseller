import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Mail, Phone, Plus, User2, X } from 'lucide-react';
import { ClientStatus } from '../../api/generated/apiClient';
import { DataTable } from '../../components/common/DataTable';
import { Button, FormField, Input, SearchableSelect, SearchableSelectOption } from '../../components/common/Form';
import { PageHeader } from '../../components/common/PageHeader';
import { clientsRepository, ClientAdmin, ClientLookupItem } from '../../repositories/clientsRepository';

const statusOptions: SearchableSelectOption[] = [
  { value: 'PendingApproval', label: 'Pending Approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Suspended', label: 'Suspended' },
];

export const ClientsPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingClients, setExistingClients] = useState<ClientLookupItem[]>([]);
  const [recentlyCreatedClient, setRecentlyCreatedClient] = useState<ClientAdmin | null>(null);
  const [currencies, setCurrencies] = useState<SearchableSelectOption[]>([]);
  const [languages, setLanguages] = useState<SearchableSelectOption[]>([]);

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [preferredCurrencyId, setPreferredCurrencyId] = useState('');
  const [preferredLanguageId, setPreferredLanguageId] = useState('');
  const [priceTierId, setPriceTierId] = useState('');
  const [status, setStatus] = useState<ClientStatus>('PendingApproval');

  const resetForm = () => {
    setName('');
    setBusinessName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setPreferredCurrencyId('');
    setPreferredLanguageId('');
    setPriceTierId('');
    setStatus('PendingApproval');
  };

  const fetchLookups = async () => {
    setLookupLoading(true);
    try {
      const response = await clientsRepository.getCreateClientLookups();
      setExistingClients(response.clients);
      setCurrencies((response.currencies || []).map((item) => ({ value: item.id || '', label: `${item.name || 'Unnamed currency'}${item.code ? ` (${item.code})` : ''}`, searchText: [item.code, item.symbol].filter(Boolean).join(' ') })));
      setLanguages((response.languages || []).map((item) => ({ value: item.id || '', label: item.name || 'Unnamed language', searchText: item.code })));
    } catch (error) {
      console.error('Failed to load client lookups', error);
      alert('Failed to load client form options');
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  const clientRows = useMemo(() => {
    const rows = existingClients.map((client) => ({ id: client.id, name: client.name, businessName: '—', email: '—', phone: '—', status: 'Existing' }));
    if (recentlyCreatedClient?.id) {
      const alreadyIncluded = rows.some((item) => item.id === recentlyCreatedClient.id);
      if (!alreadyIncluded) {
        return [recentlyCreatedClient, ...rows];
      }
    }
    return rows;
  }, [existingClients, recentlyCreatedClient]);

  const handleCreateClient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const created = await clientsRepository.createClient({
        name: name.trim(),
        businessName: businessName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim() || undefined,
        preferredCurrencyId: preferredCurrencyId || undefined,
        preferredLanguageId: preferredLanguageId || undefined,
        priceTierId: priceTierId.trim() || undefined,
        status,
      });
      setRecentlyCreatedClient(created);
      setIsCreateModalOpen(false);
      resetForm();
      await fetchLookups();
    } catch (error) {
      console.error('Failed to create client', error);
      alert('Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Clients"
          description="Create wholesale clients while keeping the current admin layout and form styling intact."
          actions={
            <button onClick={() => { resetForm(); setIsCreateModalOpen(true); }} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium hover:bg-gray-800">
              <Plus size={16} /> Create Client
            </button>
          }
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-[24px] border border-gray-50 p-6 shadow-sm">
              <h2 className="text-lg font-medium text-gray-900">Client Directory Preview</h2>
              <p className="mt-1 text-sm text-gray-400">Existing clients are loaded from current lookup data so the create flow can refresh without changing architecture.</p>
            </div>
            <DataTable
              data={clientRows}
              loading={lookupLoading}
              columns={[
                { header: 'Client', accessor: (item: ClientAdmin) => <div><p className="font-medium text-gray-900">{item.name || 'Unnamed client'}</p><p className="text-[10px] text-gray-400 uppercase tracking-tighter">{item.id}</p></div> },
                { header: 'Business', accessor: (item: ClientAdmin) => item.businessName || '—' },
                { header: 'Email', accessor: (item: ClientAdmin) => item.email || '—' },
                { header: 'Phone', accessor: (item: ClientAdmin) => item.phone || '—' },
                { header: 'Status', accessor: (item: ClientAdmin) => <span className="px-2 py-1 rounded-full bg-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-600">{item.status || '—'}</span> },
              ]}
            />
          </div>

          <div className="bg-white rounded-[24px] border border-gray-50 p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-medium text-gray-900">Create Flow Notes</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3"><User2 size={16} className="mt-0.5 text-gray-400" /><p>Create a named client profile for wholesale ordering.</p></div>
              <div className="flex items-start gap-3"><Building2 size={16} className="mt-0.5 text-gray-400" /><p>Capture business details without redesigning the admin area.</p></div>
              <div className="flex items-start gap-3"><Mail size={16} className="mt-0.5 text-gray-400" /><p>Save the primary contact email the backend expects.</p></div>
              <div className="flex items-start gap-3"><Phone size={16} className="mt-0.5 text-gray-400" /><p>Keep phone/address fields available for operational follow-up.</p></div>
            </div>
            {recentlyCreatedClient ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-sm font-semibold text-emerald-700">Last created client</p>
                <p className="mt-1 text-sm text-emerald-900">{recentlyCreatedClient.name} • {recentlyCreatedClient.businessName || 'No business name'}</p>
                <p className="text-xs text-emerald-700">{recentlyCreatedClient.email || 'No email'} • {recentlyCreatedClient.phone || 'No phone'}</p>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }} className="relative w-full max-w-3xl bg-white rounded-[32px] shadow-xl p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-light text-gray-900">Create Client</h2>
                  <p className="text-sm text-gray-400">Add a new client using the backend-supported fields only.</p>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Name">
                    <Input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Primary contact name" />
                  </FormField>
                  <FormField label="Business Name">
                    <Input required value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Business / company name" />
                  </FormField>
                  <FormField label="Email">
                    <Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="client@example.com" />
                  </FormField>
                  <FormField label="Phone">
                    <Input required value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Mobile or office phone" />
                  </FormField>
                  <FormField label="Address">
                    <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Optional address" />
                  </FormField>
                  <FormField label="Preferred Currency">
                    <SearchableSelect name="preferredCurrencyId" value={preferredCurrencyId} onChange={setPreferredCurrencyId} options={currencies} placeholder="Select currency" searchPlaceholder="Search currencies" />
                  </FormField>
                  <FormField label="Preferred Language">
                    <SearchableSelect name="preferredLanguageId" value={preferredLanguageId} onChange={setPreferredLanguageId} options={languages} placeholder="Select language" searchPlaceholder="Search languages" />
                  </FormField>
                  <FormField label="Status">
                    <SearchableSelect name="status" value={status} onChange={(value) => setStatus(value as ClientStatus)} options={statusOptions} placeholder="Select status" searchPlaceholder="Search status" required />
                  </FormField>
                  <div className="md:col-span-2">
                    <FormField label="Price Tier ID">
                      <Input value={priceTierId} onChange={(event) => setPriceTierId(event.target.value)} placeholder="Optional price tier identifier" />
                    </FormField>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-3 rounded-xl bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
                  <Button type="submit" className="!w-auto px-6" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Client'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
