// Used for testing purpose
import { DataIngestionClient, type JobInput } from "@trelent/data-ingestion";
import type { IngestionService, IngestionJob } from "./ingestion";

export function createTrelentIngestionService(): IngestionService {
  const client = new DataIngestionClient();

  return {
    async startJobFromFile(fileId: string) {
      const job: JobInput = {
        connector: {
          type: "file_upload",
          file_ids: [fileId],
        },
        output: {
          type: "s3-signed-url",
          expires_minutes: 120,
        },
      };

      const response = await client.submitJob(job);
      return { jobId: response.job_id };
    },

    async getJobStatus(jobId: string): Promise<IngestionJob> {
      const status = await client.getJobStatus(jobId, {
        includeMarkdown: false,
        includeFileMetadata: true,
      });

      const jobStatus = status.status as unknown as string;

      return {
        jobId,
        status: jobStatus as any,
        markdownUrl: undefined, // could be derived from status.delivery later
      };
    },
  };
}
