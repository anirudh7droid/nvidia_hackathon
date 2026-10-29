import type { ResearchOptions } from "@/lib/research-options";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type SSEHandler = (event: string, data: string) => void;

export class ResearchStreamError extends Error {}

export async function streamResearch(
  topic: string,
  options: ResearchOptions,
  onEvent: SSEHandler,
  signal?: AbortSignal
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, model: options.model, depth: options.depth }),
      signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    // The browser only says "Failed to fetch"; name the likely cause instead.
    throw new ResearchStreamError(
      `Can't reach the research server at ${API_BASE_URL}. Start it with: python backend/main.py`
    );
  }

  if (!response.ok || !response.body) {
    // FastAPI puts validation problems in `detail`; surface them when present.
    const detail = await response
      .json()
      .then((body: { detail?: unknown }) =>
        typeof body.detail === "string" ? body.detail : null
      )
      .catch(() => null);
    throw new ResearchStreamError(
      detail ?? `Research request failed with status ${response.status}`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    // sse-starlette terminates lines with CRLF; normalise so blank-line splits work.
    // Normalise the whole buffer and hold back a trailing "\r": a chunk can end
    // between "\r" and "\n", and normalising chunks alone would split an event.
    buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n|\r(?=[^\n])/g, "\n");

    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      parseAndEmit(rawEvent, onEvent);
    }
  }

  buffer += decoder.decode().replace(/\r$/, "");
  if (buffer.trim()) {
    parseAndEmit(buffer.replace(/\r\n?/g, "\n"), onEvent);
  }
}

function parseAndEmit(rawEvent: string, onEvent: SSEHandler): void {
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length > 0) {
    onEvent(eventName, dataLines.join("\n"));
  }
}
