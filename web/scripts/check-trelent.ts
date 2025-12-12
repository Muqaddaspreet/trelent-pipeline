// web/scripts/check-trelent.ts
import { DataIngestionClient } from "@trelent/data-ingestion";

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

  try {
    // Calling listFiles() to check if the API is working
    const files = await client.listFiles();
    console.log("listFiles() succeeded, got", files.files.length, "file(s).");
  } catch (err) {
    console.error("listFiles() failed with error: ", err);
    console.error(err);
  }
}

main().catch((err) => {
  console.error("Unexpected top-level error:", err);
  process.exit(1);
});
