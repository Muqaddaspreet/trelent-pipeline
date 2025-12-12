import { NextResponse } from "next/server";
import { DataIngestionClient, type JobInput } from "@trelent/data-ingestion";

export const runtime = "nodejs";

const client = new DataIngestionClient();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { ok: false, error: "Missing file upload" },
        { status: 400 }
      );
    }

    const fileBlob = file as Blob;
    const fileName = (file as any).name || "uploaded-document.pdf";

    // Uploading file to Trelent
    const upload = await client.uploadFile(fileBlob, fileName, {
      expiresInDays: 7,
    });

    // Creating job with file_upload connector
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

    const { job_id } = await client.submitJob(job);

    return NextResponse.json({
      ok: true,
      jobId: job_id,
      fileId: upload.id,
      fileName,
    });
  } catch (err: any) {
    console.error("Error in POST /api/runs:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
