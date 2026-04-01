import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, PlayCircle, RefreshCcw, AlertCircle, CheckCircle2, Clock3 } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/common/DataTable';
import { bulkProductUploadRepository, BulkUploadJobStatus } from '../../repositories/bulkProductUploadRepository';

type StoredJob = {
  jobId: string;
  createdAt: string;
};

const JOB_STORAGE_KEY = 'bulk_upload_job_history';
const PAGE_SIZE = 10;

const readStoredJobs = (): StoredJob[] => {
  try {
    const raw = localStorage.getItem(JOB_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredJob[];
    return parsed.filter((job) => Boolean(job.jobId));
  } catch {
    return [];
  }
};

const writeStoredJobs = (jobs: StoredJob[]) => {
  localStorage.setItem(JOB_STORAGE_KEY, JSON.stringify(jobs.slice(0, 100)));
};

const statusClassNames: Record<string, string> = {
  Completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Failed: 'bg-rose-50 text-rose-700 border border-rose-200',
  Processing: 'bg-amber-50 text-amber-700 border border-amber-200',
  Pending: 'bg-slate-100 text-slate-600 border border-slate-200',
};

export const BulkProductUploadPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [jobIdInput, setJobIdInput] = useState('');
  const [activeJob, setActiveJob] = useState<BulkUploadJobStatus | null>(null);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [jobHistory, setJobHistory] = useState<StoredJob[]>([]);
  const [historyStatusByJobId, setHistoryStatusByJobId] = useState<Record<string, BulkUploadJobStatus>>({});
  const [page, setPage] = useState(1);

  const loadHistory = () => {
    setJobHistory(readStoredJobs());
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const rememberJob = (jobId: string) => {
    const next = [{ jobId, createdAt: new Date().toISOString() }, ...readStoredJobs().filter((job) => job.jobId !== jobId)];
    writeStoredJobs(next);
    setJobHistory(next);
  };

  const refreshJobStatus = async (jobId: string, background: boolean = false) => {
    if (!jobId) return;

    if (!background) {
      setIsRefreshingStatus(true);
      setError(null);
    }

    try {
      const status = await bulkProductUploadRepository.getJobStatus(jobId);
      setActiveJob(status);
      setHistoryStatusByJobId((current) => ({ ...current, [status.jobId]: status }));
      setJobIdInput(status.jobId);
      rememberJob(status.jobId);
    } catch (err) {
      if (!background) {
        setError(err instanceof Error ? err.message : 'Unable to fetch job status');
      }
    } finally {
      if (!background) {
        setIsRefreshingStatus(false);
      }
    }
  };

  useEffect(() => {
    if (!activeJob || activeJob.status !== 'Processing') {
      return;
    }

    const interval = window.setInterval(() => {
      refreshJobStatus(activeJob.jobId, true);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [activeJob?.jobId, activeJob?.status]);

  useEffect(() => {
    if (jobHistory.length === 0) return;

    const jobIds = jobHistory.slice(0, 20).map((job) => job.jobId);
    jobIds.forEach((jobId) => {
      if (!historyStatusByJobId[jobId]) {
        refreshJobStatus(jobId, true);
      }
    });
  }, [jobHistory]);

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a CSV file first.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const jobId = await bulkProductUploadRepository.uploadCsv(selectedFile);
      setSuccessMessage('CSV uploaded and queued successfully.');
      setSelectedFile(null);
      setJobIdInput(jobId);
      rememberJob(jobId);
      await refreshJobStatus(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CSV');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResume = async () => {
    const jobId = jobIdInput.trim();
    if (!jobId) {
      setError('Job ID is required to resume.');
      return;
    }

    setIsResuming(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await bulkProductUploadRepository.resumeJob(jobId);
      setSuccessMessage('Job re-queued successfully.');
      rememberJob(jobId);
      await refreshJobStatus(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resume job');
    } finally {
      setIsResuming(false);
    }
  };

  const pagedHistory = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return jobHistory.slice(start, start + PAGE_SIZE);
  }, [jobHistory, page]);

  const historyColumns = useMemo(() => [
    {
      header: 'Job ID',
      accessor: (item: StoredJob) => <span className="font-mono text-xs text-gray-700">{item.jobId}</span>,
    },
    {
      header: 'Status',
      accessor: (item: StoredJob) => {
        const status = historyStatusByJobId[item.jobId]?.status || 'Unknown';
        return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${statusClassNames[status] || 'bg-slate-100 text-slate-600 border border-slate-200'}`}>{status}</span>;
      },
    },
    {
      header: 'Rows',
      accessor: (item: StoredJob) => {
        const status = historyStatusByJobId[item.jobId];
        if (!status) return '—';
        return `${status.processedRows}/${status.totalRows}`;
      },
    },
    {
      header: 'Created',
      accessor: (item: StoredJob) => new Date(item.createdAt).toLocaleString(),
    },
    {
      header: 'Action',
      accessor: (item: StoredJob) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setJobIdInput(item.jobId);
            refreshJobStatus(item.jobId);
          }}
          className="text-xs font-medium text-gray-800 hover:text-black"
        >
          View status
        </button>
      ),
    },
  ], [historyStatusByJobId]);

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-6"><div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Bulk Product Upload"
        description="Upload product CSV files using multipart/form-data, monitor background processing, and resume failed jobs without reprocessing completed rows."
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm space-y-5">
        <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">CSV File</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
            />
          </div>
          <button type="button" onClick={handleUpload} disabled={isUploading} className="inline-flex !w-auto items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">
            <Upload size={16} /> {isUploading ? 'Uploading...' : 'Upload & Queue'}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] items-end">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Job ID</label>
            <input
              type="text"
              value={jobIdInput}
              onChange={(event) => setJobIdInput(event.target.value)}
              placeholder="Paste existing job ID"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400"
            />
          </div>
          <button type="button" onClick={() => refreshJobStatus(jobIdInput.trim())} disabled={isRefreshingStatus} className="inline-flex !w-auto items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            <RefreshCcw size={16} /> {isRefreshingStatus ? 'Refreshing...' : 'Check Status'}
          </button>
          <button type="button" onClick={handleResume} disabled={isResuming} className="inline-flex !w-auto items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">
            <PlayCircle size={16} /> {isResuming ? 'Resuming...' : 'Resume Job'}
          </button>
        </div>

        {error && <p className="text-sm text-rose-600 flex items-center gap-2"><AlertCircle size={16} /> {error}</p>}
        {successMessage && <p className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle2 size={16} /> {successMessage}</p>}
      </motion.div>

      {activeJob && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-500">Active Job</p>
              <p className="font-mono text-sm text-gray-800 break-all">{activeJob.jobId}</p>
            </div>
            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClassNames[activeJob.status] || 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
              {activeJob.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4"><p className="text-xs text-gray-500">Total Rows</p><p className="text-xl font-semibold text-gray-900">{activeJob.totalRows}</p></div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4"><p className="text-xs text-gray-500">Processed</p><p className="text-xl font-semibold text-gray-900">{activeJob.processedRows}</p></div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4"><p className="text-xs text-emerald-700">Successful</p><p className="text-xl font-semibold text-emerald-700">{activeJob.successfulRows}</p></div>
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4"><p className="text-xs text-rose-700">Failed</p><p className="text-xl font-semibold text-rose-700">{activeJob.failedRows}</p></div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p className="inline-flex items-center gap-1"><Clock3 size={13} /> Started: {activeJob.startedAt ? new Date(activeJob.startedAt).toLocaleString() : '—'}</p>
            <p>Completed: {activeJob.completedAt ? new Date(activeJob.completedAt).toLocaleString() : '—'}</p>
            {activeJob.errorMessage && <p className="text-rose-700">Error: {activeJob.errorMessage}</p>}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Job History</h2>
          <p className="text-xs text-gray-500">Shows locally tracked jobs for quick resume/status checks.</p>
        </div>

        <DataTable data={pagedHistory} columns={historyColumns} loading={false} />

        <div className="mt-2 flex items-center justify-between px-1">
          <p className="text-xs text-gray-500">Showing <span className="text-gray-900 font-medium">{pagedHistory.length}</span> of <span className="text-gray-900 font-medium">{jobHistory.length}</span> jobs</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="px-4 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">Previous</button>
            <button disabled={page * PAGE_SIZE >= jobHistory.length} onClick={() => setPage((current) => current + 1)} className="px-4 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors">Next</button>
          </div>
        </div>
      </motion.div>
    </div></div>
  );
};
