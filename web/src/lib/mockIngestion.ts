// Used for testing purpose
import type { IngestionService, IngestionJob } from "./ingestion";

const jobs = new Map<
  string,
  { createdAt: number; status: IngestionJob["status"] }
>();

export function createMockIngestionService(): IngestionService {
  return {
    async startJobFromFile(fileId: string) {
      const jobId = `mock_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      jobs.set(jobId, { createdAt: Date.now(), status: "queued" });
      return { jobId };
    },

    async getJobStatus(jobId: string): Promise<IngestionJob> {
      const job = jobs.get(jobId);
      if (!job) {
        return { jobId, status: "failed" };
      }

      const age = Date.now() - job.createdAt;
      let status: IngestionJob["status"] = "queued";
      if (age > 2000) status = "running";
      if (age > 5000) status = "completed";

      return {
        jobId,
        status,
        markdownUrl:
          status === "completed"
            ? "https://example.com/fake-guide.md"
            : undefined,
      };
    },
  };
}
