# Trelent Take-Home Assignment

## What I built

- Next.js + Bun frontend to upload a doc, trigger ingestion, and render a rewritten HTML guide.
- Frontend-only UX polish: drag-and-drop upload card, status badges, and rendered guide viewer.

## How to run

- Requirements: Node/Bun, or Docker.
- Local: `cd web && bun install && bun dev` (visit http://localhost:3000).
- Docker: create `.env`, then `docker-compose up --build` (port 3000).

### Environment variables

Create `web/.env.local`:

```env
TRELENT_DATA_INGESTION_API_URL=https://api.trelent.com
TRELENT_DATA_INGESTION_API_TOKEN=your_trelent_token_here
OPENAI_API_KEY=sk-your-openai-key-here
```

## How it fits together

- UI posts the uploaded file to `/api/runs` → Trelent ingestion job → polls `/api/runs/status`.
- On completion, fetches Markdown URL, sends to `/api/rewrite-guide` → renders via `GuideViewer`.
- Env flags: `USE_TRELENT` selects real vs mock ingestion.

## Tradeoffs

- **Simple, synchronous flow**: The pipeline runs step-by-step without background queues, making it easier to understand and debug but less scalable for large batches.

- **Single-document flow**: The UI currently runs the pipeline for one file at a time.

- **No authentication**: The app assumes trusted internal users. Real deployments would need user accounts and access controls.

- **Frontend polling**: The UI polls for job status every 2 seconds, which works fine for single jobs but could get noisy with many concurrent runs.

- **Basic error handling**: Errors are shown to users.

## Next steps

- Add support for combining multiple documents
- Tighten input validation, file-type checks, and testing
- Search functionality when search API is available

```

```
