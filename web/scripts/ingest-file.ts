// scripts/ingest-file.ts
import { DataIngestionClient, type JobInput } from "@trelent/data-ingestion";
import { readFileSync } from "node:fs";

async function main() {
  const client = new DataIngestionClient();

  const filePath = process.argv[2] ?? "sample-files/sample.pdf";

  console.log(`Reading file: ${filePath}`);
  const fileBuffer = readFileSync(filePath);

  const blob = new Blob([fileBuffer], { type: "application/pdf" });

  console.log("Uploading file to Trelent…");
  const upload = await client.uploadFile(blob, filePath, { expiresInDays: 30 });
  console.log("Uploaded file. ID:", upload.id);

  const job: JobInput = {
    connector: {
      type: "file_upload",
      file_ids: [upload.id],
    },
    output: {
      type: "s3-signed-url",
      expires_minutes: 120,
    },
  };

  console.log("Submitting ingestion job…");

  const response = await client.submitJob(job);
  console.log("Job submitted. ID:", response.job_id);

  // Polling for status
  const pollIntervalMs = 3000;

  while (true) {
    console.log("Checking job status…");
    const status = await client.getJobStatus(response.job_id, {
      includeMarkdown: false,
      includeFileMetadata: true,
    });

    const jobStatus = status.status as unknown as string;
    console.log("   Current status:", jobStatus);

    if (jobStatus === "completed" || jobStatus === "failed") {
      if (status.delivery) {
        console.log("Delivery keys:", Object.keys(status.delivery));
        console.log("Full delivery object:");
        console.log(JSON.stringify(status.delivery, null, 2));
      }

      if (jobStatus === "failed") {
        const statusWithError = status as {
          error?: unknown;
          errors?: unknown;
        };
        const errorDetail =
          statusWithError.error ?? statusWithError.errors ?? "Unknown error";

        console.error("Job failed:", errorDetail);
        process.exit(1);
      }

      console.log("Job completed!");
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }
}

main().catch(async (err: unknown) => {
  console.error("Unexpected error while submitting job or polling:");
  console.error(err);

  try {
    if (typeof err === "object" && err !== null) {
      const e = err as {
        cause?: unknown;
        response?: { status?: number; text?: () => Promise<string> };
      };

      if (e.cause !== undefined) {
        console.error("Cause:", e.cause);
      }

      const resp = e.response;
      if (resp && typeof resp.text === "function") {
        console.error("HTTP status:", resp.status);
        const body = await resp.text();
        console.error("Response body:", body);
      }
    }
  } catch (nested) {
    console.error("Failed to inspect error.response:", nested);
  }

  process.exit(1);
});
