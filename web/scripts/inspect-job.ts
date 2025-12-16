import { DataIngestionClient } from "@trelent/data-ingestion";

async function main() {
  const jobId = process.argv[2];
  if (!jobId) {
    console.error("Usage: bun scripts/inspect-job.ts <job_id>");
    process.exit(1);
  }

  const client = new DataIngestionClient();

  const status = await client.getJobStatus(jobId, {
    includeMarkdown: false,
    includeFileMetadata: true,
  });

  console.log(JSON.stringify(status, null, 2));
}

main().catch((err) => {
  console.error("inspect-job error:", err);
  process.exit(1);
});
