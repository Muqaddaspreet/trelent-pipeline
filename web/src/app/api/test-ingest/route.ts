import { NextResponse } from "next/server";
import {
  DataIngestionClient,
  type JobInput,
  type DataIngestionConfig,
} from "@trelent/data-ingestion";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Logging what config we're actually using
    console.log("TRELENT URL:", process.env.TRELENT_DATA_INGESTION_API_URL);
    console.log(
      "TRELENT TOKEN prefix:",
      process.env.TRELENT_DATA_INGESTION_API_TOKEN?.slice(0, 8)
    );

    const config: DataIngestionConfig = {
      baseUrl: process.env.TRELENT_DATA_INGESTION_API_URL!,
      token: process.env.TRELENT_DATA_INGESTION_API_TOKEN!,
    } as any;

    const client = new DataIngestionClient(config);

    const job: JobInput = {
      connector: {
        type: "url",
        urls: [
          "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        ],
      },
      output: {
        type: "s3-signed-url",
      },
    };

    const { job_id } = await client.submitJob(job);

    return NextResponse.json({ ok: true, job_id });
  } catch (err: any) {
    console.error("Error in /api/test-ingest:", err);

    const details: any = { message: String(err) };

    try {
      const resp = (err as any)?.response;
      if (resp && typeof resp.text === "function") {
        const body = await resp.text();
        details.httpStatus = resp.status;
        details.httpBody = body;
      }
    } catch {
      // Ignoring it as it's just for testing
    }

    return NextResponse.json({ ok: false, error: details }, { status: 500 });
  }
}
