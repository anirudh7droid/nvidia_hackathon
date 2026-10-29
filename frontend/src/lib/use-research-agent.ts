"use client";

import { useCallback, useRef, useState } from "react";
import { streamResearch } from "@/lib/stream-research";
import type {
  AgentPhase,
  AgentStage,
  ErrorEventData,
  LogEntry,
  SavedReport,
  Source,
  StatusEventData,
  TokenEventData,
} from "@/lib/types";

export type AgentState = {
  phase: AgentPhase;
  stage: AgentStage | null;
  topic: string;
  statusMessage: string;
  queries: string[];
  sources: Source[];
  report: string;
  errorMessage: string | null;
  startedAt: number | null;
  finishedAt: number | null;
  log: LogEntry[];
};

const initialState: AgentState = {
  phase: "idle",
  stage: null,
  topic: "",
  statusMessage: "",
  queries: [],
  sources: [],
  report: "",
  errorMessage: null,
  startedAt: null,
  finishedAt: null,
  log: [],
};

function entry(level: LogEntry["level"], message: string): LogEntry {
  return { at: Date.now(), level, message };
}

export function useResearchAgent() {
  const [state, setState] = useState<AgentState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(async (topic: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({
      ...initialState,
      phase: "running",
      topic,
      startedAt: Date.now(),
      log: [entry("info", `Session started: "${topic}"`)],
    });

    try {
      await streamResearch(
        topic,
        (event, rawData) => {
          if (rawData === "[DONE]") return;
          let data: unknown;
          try {
            data = JSON.parse(rawData);
          } catch {
            return;
          }

          if (event === "status") {
            const payload = data as StatusEventData;
            setState((prev) => ({
              ...prev,
              stage: payload.stage,
              statusMessage: payload.message,
              queries: payload.queries ?? prev.queries,
              sources: payload.sources ?? prev.sources,
              log: [...prev.log, entry("info", payload.message)],
            }));
          } else if (event === "token") {
            const payload = data as TokenEventData;
            setState((prev) => ({ ...prev, report: prev.report + payload.text }));
          } else if (event === "error") {
            const payload = data as ErrorEventData;
            setState((prev) => ({
              ...prev,
              phase: "error",
              errorMessage: payload.message,
              finishedAt: Date.now(),
              log: [...prev.log, entry("error", payload.message)],
            }));
          } else if (event === "done") {
            setState((prev) => ({
              ...prev,
              phase: "done",
              finishedAt: Date.now(),
              log: [...prev.log, entry("success", "Report complete.")],
            }));
          }
        },
        controller.signal
      );
      // Stream closed: never leave the UI spinning, even if no terminal event arrived.
      setState((prev) => {
        if (prev.phase !== "running") return prev;
        if (prev.report) {
          return {
            ...prev,
            phase: "done",
            finishedAt: Date.now(),
            log: [...prev.log, entry("success", "Report complete.")],
          };
        }
        const message = "The research stream ended unexpectedly.";
        return {
          ...prev,
          phase: "error",
          errorMessage: message,
          finishedAt: Date.now(),
          log: [...prev.log, entry("error", message)],
        };
      });
    } catch (error) {
      if (controller.signal.aborted) return;
      const message =
        error instanceof Error ? error.message : "Unknown error occurred.";
      setState((prev) => ({
        ...prev,
        phase: "error",
        errorMessage: message,
        finishedAt: Date.now(),
        log: [...prev.log, entry("error", message)],
      }));
    }
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) =>
      prev.phase === "running"
        ? {
            ...prev,
            phase: "error",
            errorMessage: "Cancelled by user.",
            finishedAt: Date.now(),
            log: [...prev.log, entry("warn", "Cancelled by user.")],
          }
        : prev
    );
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(initialState);
  }, []);

  const load = useCallback((saved: SavedReport) => {
    abortRef.current?.abort();
    setState({
      ...initialState,
      phase: "done",
      stage: "synthesizing",
      topic: saved.topic,
      queries: saved.queries,
      sources: saved.sources,
      report: saved.report,
      startedAt: saved.createdAt - saved.durationMs,
      finishedAt: saved.createdAt,
      log: [entry("info", `Loaded from history: "${saved.topic}"`)],
    });
  }, []);

  return { state, start, stop, reset, load };
}

