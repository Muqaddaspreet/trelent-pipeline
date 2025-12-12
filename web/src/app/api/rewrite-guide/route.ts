// web/src/app/api/rewrite-guide/route.ts
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const markdown = body?.markdown as string | undefined;

    if (!markdown || typeof markdown !== "string" || !markdown.trim()) {
      return NextResponse.json(
        { ok: false, error: "Missing or empty 'markdown' field in body." },
        { status: 400 }
      );
    }

    const prompt = `
You are an editor that rewrites internal documentation into a clean HTML "guide".

Input:
- Markdown text from an ingested document.
- It may contain headings, bullet points, and paragraphs.

Your job:
- Produce semantic HTML suitable for rendering in a handbook:
  - Use <h1>, <h2>, <h3> for headings.
  - Use <p> for paragraphs.
  - Use <ul>/<ol> with <li> for lists.
  - Use <strong>, <em>, <code> where helpful.
- Improve clarity and structure, but keep the original meaning.
- Do NOT include <html>, <head>, or <body> – only the inner content fragment.
- Do NOT explain what you are doing. Output only HTML.

Markdown to rewrite:
--------------------
${markdown}
`;

    const { text } = await generateText({
      model: openai("gpt-4.1-mini"),
      prompt,
    });

    return NextResponse.json({ ok: true, html: text });
  } catch (err: any) {
    console.error("Error in POST /api/rewrite-guide:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Failed to rewrite guide.",
      },
      { status: 500 }
    );
  }
}
