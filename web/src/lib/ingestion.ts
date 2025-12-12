// Used for testing purpose
export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface IngestionJob {
  jobId: string;
  status: JobStatus;
  markdownUrl?: string;
}

export interface IngestionService {
  startJobFromFile(fileId: string): Promise<{ jobId: string }>;
  getJobStatus(jobId: string): Promise<IngestionJob>;
}
