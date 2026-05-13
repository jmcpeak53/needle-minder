import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { extname, join } from "node:path";

import {
  applyReviewedFamilies,
  loadAuditDataset,
  regenerateCatalogFixtures,
  saveReview,
  validateReferenceCatalogs
} from "./catalogFamilyAuditLib";

const PUBLIC_DIR = join(__dirname, "..", "tools", "catalog-family-audit", "public");

type ReviewPayload = {
  key: string;
  status: "unreviewed" | "confirmed" | "changed" | "needs-research";
  reviewedFamily: string;
  notes: string;
};

async function main(): Promise<void> {
  const port = await findOpenPort(4173);

  const server = createServer(async (request, response) => {
    try {
      await routeRequest(request, response);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }));
    }
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`Catalog family audit running at http://127.0.0.1:${port}`);
  });
}

async function routeRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const method = request.method ?? "GET";
  const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");

  if (method === "GET" && requestUrl.pathname === "/api/audit") {
    writeJson(response, 200, loadAuditDataset());
    return;
  }

  if (method === "POST" && requestUrl.pathname === "/api/review") {
    const payload = (await readJsonBody(request)) as ReviewPayload;
    if (!payload?.key) {
      writeJson(response, 400, { error: "Missing review key." });
      return;
    }

    const review = saveReview(payload.key, {
      status: payload.status,
      reviewedFamily: payload.reviewedFamily,
      notes: payload.notes
    });
    writeJson(response, 200, { ok: true, review });
    return;
  }

  if (method === "POST" && requestUrl.pathname === "/api/apply") {
    const result = applyReviewedFamilies();
    regenerateCatalogFixtures();
    validateReferenceCatalogs();
    writeJson(response, 200, { ok: true, result });
    return;
  }

  if (method === "GET" && (requestUrl.pathname === "/" || requestUrl.pathname === "/index.html")) {
    writeStaticFile(response, "index.html");
    return;
  }

  if (method === "GET" && requestUrl.pathname.startsWith("/")) {
    const filePath = requestUrl.pathname.slice(1);
    writeStaticFile(response, filePath);
    return;
  }

  writeJson(response, 404, { error: "Not found." });
}

function writeStaticFile(response: ServerResponse, relativePath: string): void {
  const path = join(PUBLIC_DIR, relativePath);
  const content = readFileSync(path);
  response.writeHead(200, { "Content-Type": getContentType(path) });
  response.end(content);
}

function writeJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.from(chunk));
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function getContentType(path: string): string {
  switch (extname(path)) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

function findOpenPort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const candidate = createServer();
    candidate.once("error", (error: NodeJS.ErrnoException) => {
      candidate.close();
      if (error.code === "EADDRINUSE") {
        resolve(findOpenPort(startPort + 1));
        return;
      }
      reject(error);
    });
    candidate.once("listening", () => {
      const address = candidate.address();
      candidate.close(() => {
        if (!address || typeof address === "string") {
          reject(new Error("Unable to determine open port."));
          return;
        }
        resolve(address.port);
      });
    });
    candidate.listen(startPort, "127.0.0.1");
  });
}

void main();
