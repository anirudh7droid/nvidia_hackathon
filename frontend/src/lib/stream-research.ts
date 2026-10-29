export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type SSEHandler = (event: string, data: string) => void;

export class ResearchStreamError extends Error {}

export async function streamResearch(
  topic: string,
  onEvent: SSEHandler,
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/research`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new ResearchStreamError(
      `Research request failed with status ${response.status}`
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    // sse-starlette terminates lines with CRLF; normalise so blank-line splits work.
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n?/g, "\n");

    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      parseAndEmit(rawEvent, onEvent);
    }
  }

  if (buffer.trim()) {
    parseAndEmit(buffer, onEvent);
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
