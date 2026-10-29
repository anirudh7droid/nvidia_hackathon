export type AgentStage =
  | "planning"
  | "planned"
  | "searching"
  | "searched"
  | "synthesizing";

export type Source = {
  title: string;
  url: string;
  content: string;
};

export type StatusEventData = {
  stage: AgentStage;
  message: string;
  queries?: string[];
  sources?: Source[];
};

export type TokenEventData = {
  text: string;
};

export type ErrorEventData = {
  message: string;
};

export type AgentPhase = "idle" | "running" | "done" | "error";

export type LogEntry = {
  at: number;
  level: "info" | "success" | "warn" | "error";
  message: string;
};

export type SavedReport = {
  id: string;
  topic: string;
  report: string;
  queries: string[];
  sources: Source[];
  createdAt: number;
  durationMs: number;
};
