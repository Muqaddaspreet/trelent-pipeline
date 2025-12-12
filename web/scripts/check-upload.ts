// web/scripts/check-upload.ts
import { DataIngestionClient, type JobInput } from "@trelent/data-ingestion";
import { readFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log(
    "TRELENT_DATA_INGESTION_API_URL:",
    process.env.TRELENT_DATA_INGESTION_API_URL
  );
  console.log(
    "TRELENT_DATA_INGESTION_API_TOKEN prefix:",
    process.env.TRELENT_DATA_INGESTION_API_TOKEN?.slice(0, 8)
  );

  const client = new DataIngestionClient();

  // 1) Read sample.pdf from web/sample-files
  const filePath = join(process.cwd(), "sample-files", "sample.pdf");
  console.log("Reading file from:", filePath);
  const buf = readFileSync(filePath);
  const blob = new Blob([buf], { type: "application/pdf" });

  // 2) Upload
  console.log("Uploading file...");
  const upload = await client.uploadFile(blob, "sample.pdf", {
    expiresInDays: 7,
  });
  console.log("Uploaded. File ID:", upload.id);

  // 3) Start a job
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

  console.log("Submitting job...");
  const { job_id } = await client.submitJob(job);
  console.log("Job submitted. Job ID:", job_id);

  // 4) Polling job status a couple of times just to see if status responds at all
  console.log("Polling job status (few times)...");
  for (let i = 0; i < 3; i++) {
    const status = await client.getJobStatus(job_id, {
      includeMarkdown: false,
      includeFileMetadata: true,
    });
    console.log(`  Poll ${i + 1}:`, status.status);
    if (status.status === "completed") break;
    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error("check-upload failed:", err);
  process.exit(1);
});
