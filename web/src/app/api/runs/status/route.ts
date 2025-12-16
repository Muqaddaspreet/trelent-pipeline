import { NextResponse } from "next/server";
import {
  DataIngestionClient,
  JobStatus,
  type JobStatusResponse,
} from "@trelent/data-ingestion";

export const runtime = "nodejs";

const client = new DataIngestionClient();

type DeliveryMap = NonNullable<JobStatusResponse["delivery"]>;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { ok: false, error: "Missing jobId query param" },
        { status: 400 }
      );
    }

    const status = await client.getJobStatus(jobId, {
      includeMarkdown: false,
      includeFileMetadata: true,
    });

    const jobStatus = status.status as JobStatus;

    // If completed, grabbing first markdown_delivery URL from delivery map
    let markdownUrl: string | undefined;

    if (jobStatus === JobStatus.Completed && status.delivery) {
      const deliveryMap = status.delivery as DeliveryMap;
      const firstDelivery = Object.values(deliveryMap)[0];

      const pointer = firstDelivery?.markdown_delivery;
      markdownUrl = typeof pointer === "string" ? pointer : undefined;
    }

    return NextResponse.json({
      ok: true,
      job: {
        jobId,
        status: jobStatus,
        markdownUrl,
      },
    });
  } catch (err) {
    console.error("Error in GET /api/runs/status:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
