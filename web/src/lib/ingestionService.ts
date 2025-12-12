// Used for testing purpose
import type { IngestionService } from "./ingestion";
import { createMockIngestionService } from "./mockIngestion";
import { createTrelentIngestionService } from "./trelentIngestion";

let service: IngestionService;

if (process.env.USE_TRELENT === "true") {
  service = createTrelentIngestionService();
} else {
  service = createMockIngestionService();
}

export const ingestionService = service;
