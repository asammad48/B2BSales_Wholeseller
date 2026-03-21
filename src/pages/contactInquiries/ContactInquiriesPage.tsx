import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, Mail, MessageSquareText, Phone, SearchCode, X } from 'lucide-react';
import { ContactInquiryStatus } from '../../api/generated/apiClient';
import { DataTable } from '../../components/common/DataTable';
import { Button, FormField, SearchableSelect, SearchableSelectOption } from '../../components/common/Form';
import { PageHeader } from '../../components/common/PageHeader';
import { SearchToolbar } from '../../components/common/SearchToolbar';
import {
  contactInquiriesRepository,
  ContactInquiry,
  ContactInquiryDetails,
} from '../../repositories/contactInquiriesRepository';

const inquiryStatusOptions: SearchableSelectOption[] = [
  { value: 'New', label: 'New' },
  { value: 'Read', label: 'Read' },
  { value: 'Replied', label: 'Replied' },
  { value: 'Closed', label: 'Closed' },
];

const statusClasses: Record<string, string> = {
  New: 'bg-blue-50 text-blue-600',
  Read: 'bg-amber-50 text-amber-700',
  Replied: 'bg-emerald-50 text-emerald-700',
  Closed: 'bg-gray-100 text-gray-600',
};

export const ContactInquiriesPage: React.FC = () => {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiryDetails | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ContactInquiryStatus>('New');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const response = await contactInquiriesRepository.getContactInquiries(page, 10, search);
      setInquiries(response.data);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to fetch contact inquiries', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInquiries();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, page]);

  const openInquiry = async (inquiry: ContactInquiry) => {
    setDetailLoading(true);
    try {
      const detail = await contactInquiriesRepository.getContactInquiryById(inquiry.id);
      setSelectedInquiry(detail);
      setSelectedStatus((detail.status || 'New') as ContactInquiryStatus);
    } catch (error) {
      console.error('Failed to fetch inquiry details', error);
      alert('Failed to fetch inquiry details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedInquiry) return;
    setStatusSubmitting(true);
    try {
      await contactInquiriesRepository.updateContactInquiryStatus(selectedInquiry.id, { status: selectedStatus });
      const refreshed = await contactInquiriesRepository.getContactInquiryById(selectedInquiry.id);
      setSelectedInquiry(refreshed);
      await fetchInquiries();
    } catch (error) {
      console.error('Failed to update inquiry status', error);
      alert('Failed to update inquiry status');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const columns = useMemo(() => [
    { header: 'Name', accessor: (item: ContactInquiry) => <div><p className="font-medium text-gray-900">{item.name}</p><p className="text-[10px] text-gray-400 uppercase tracking-tighter">{item.email}</p></div> },
    { header: 'Mobile No', accessor: (item: ContactInquiry) => item.mobileNo || '—' },
    { header: 'Subject', accessor: (item: ContactInquiry) => item.subject || '—' },
    {
      header: 'Status',
      accessor: (item: ContactInquiry) => (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusClasses[item.status] || 'bg-gray-100 text-gray-600'}`}>
          {item.status}
        </span>
      ),
    },
    { header: 'Read', accessor: (item: ContactInquiry) => item.isRead ? 'Yes' : 'No' },
    { header: 'Created At', accessor: (item: ContactInquiry) => new Date(item.createdAt).toLocaleString() },
    {
      header: 'Actions',
      accessor: (item: ContactInquiry) => (
        <button onClick={(event) => { event.stopPropagation(); openInquiry(item); }} className="inline-flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
          <Eye size={14} /> View
        </button>
      ),
    },
  ], []);

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Contact Inquiries"
          description="Review public contact submissions, inspect inquiry details, and update processing status."
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <SearchToolbar search={search} onSearchChange={setSearch} placeholder="Search by name, email, subject, or mobile number..." />
          <DataTable data={inquiries} columns={columns} loading={loading} onRowClick={openInquiry} />

          <div className="mt-6 flex items-center justify-between px-2">
            <p className="text-xs text-gray-400">
              Showing <span className="font-medium text-gray-600">{inquiries.length}</span> of <span className="font-medium text-gray-600">{total}</span> inquiries
            </p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="px-4 py-2 text-xs font-medium bg-white border border-gray-100 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">Previous</button>
              <button disabled={page * 10 >= total} onClick={() => setPage((current) => current + 1)} className="px-4 py-2 text-xs font-medium bg-white border border-gray-100 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">Next</button>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {(selectedInquiry || detailLoading) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedInquiry(null)} className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 20 }} className="relative w-full max-w-3xl bg-white rounded-[32px] shadow-xl p-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-light text-gray-900">Inquiry Details</h2>
                  <p className="text-sm text-gray-400">Inspect the full inquiry and update its status without leaving the current table flow.</p>
                </div>
                <button onClick={() => setSelectedInquiry(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              {detailLoading || !selectedInquiry ? (
                <p className="text-sm text-gray-500">Loading inquiry details...</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Contact</p>
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <p className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {selectedInquiry.email}</p>
                        <p className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {selectedInquiry.mobileNo || '—'}</p>
                        <p className="flex items-center gap-2"><SearchCode size={14} className="text-gray-400" /> {selectedInquiry.name}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Timeline</p>
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <p>Created: {new Date(selectedInquiry.createdAt).toLocaleString()}</p>
                        <p>Updated: {selectedInquiry.updatedAt ? new Date(selectedInquiry.updatedAt).toLocaleString() : '—'}</p>
                        <p>Read: {selectedInquiry.isRead ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Subject</p>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">{selectedInquiry.subject || 'No subject'}</h3>
                    <div className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm leading-6 text-gray-700 whitespace-pre-wrap">
                      <div className="flex items-center gap-2 mb-2 text-gray-500"><MessageSquareText size={16} /> Message</div>
                      {selectedInquiry.message || 'No message provided.'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
                    <FormField label="Status">
                      <SearchableSelect name="status" value={selectedStatus} onChange={(value) => setSelectedStatus(value as ContactInquiryStatus)} options={inquiryStatusOptions} placeholder="Select status" searchPlaceholder="Search statuses" required />
                    </FormField>
                    <Button type="button" className="!w-auto px-6" onClick={handleStatusUpdate} disabled={statusSubmitting}>
                      {statusSubmitting ? 'Updating...' : 'Update Status'}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
