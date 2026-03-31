import { BulkProductUploadStatusResponseDto, FileParameter } from '../api/generated/apiClient';
import { safeApiClient as apiClient } from './apiClientSafe';

export interface BulkUploadJobStatus {
  jobId: string;
  status: string;
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}

const mapStatus = (status?: BulkProductUploadStatusResponseDto): BulkUploadJobStatus => ({
  jobId: status?.jobId || '',
  status: status?.status || 'Pending',
  totalRows: status?.totalRows || 0,
  processedRows: status?.processedRows || 0,
  successfulRows: status?.successfulRows || 0,
  failedRows: status?.failedRows || 0,
  errorMessage: status?.errorMessage || undefined,
  startedAt: status?.startedAt ? new Date(status.startedAt).toISOString() : undefined,
  completedAt: status?.completedAt ? new Date(status.completedAt).toISOString() : undefined,
});

export const bulkProductUploadRepository = {
  async uploadCsv(file: File): Promise<string> {
    const body: FileParameter = {
      data: file,
      fileName: file.name,
    };

    const response = await apiClient.bulkProductUpload(body);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create bulk upload job');
    }

    return response.data;
  },

  async resumeJob(jobId: string): Promise<string> {
    const response = await apiClient.resume(jobId);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to resume bulk upload job');
    }

    return response.data;
  },

  async getJobStatus(jobId: string): Promise<BulkUploadJobStatus> {
    const response = await apiClient.jobStatus(jobId);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch bulk upload job status');
    }

    return mapStatus(response.data);
  },
};
