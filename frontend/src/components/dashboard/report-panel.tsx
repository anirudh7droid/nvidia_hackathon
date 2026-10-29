"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, Copy, Download, ExternalLink, Plus, RotateCcw, Square } from "lucide-react";
import { toast } from "sonner";
import { countWords, hostname } from "@/lib/format";
import type { AgentState } from "@/lib/use-research-agent";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "@/lib/motion";
import AILoadingState, { type AgentStep, type AgentStepStatus } from "@/components/kokonutui/ai-loading";
import AITextLoading from "@/components/kokonutui/ai-text-loading";

type ReportPanelProps = {
  state: AgentState;
  onExport: () => void;
  onRetry: () => void;
  onStop: () => void;
  onNew: () => void;
};

const STAGE_ORDER = ["planning", "planned", "searching", "searched", "synthesizing"] as const;

/** Maps the agent's stage stream onto the three steps the timeline shows. */
function agentSteps(state: AgentState): AgentStep[] {
  const at = state.stage ? STAGE_ORDER.indexOf(state.stage) : 0;
  const finished = state.phase === "done";
  const failed = state.phase === "error";
  // A step runs from stage `from` until stage `until` begins.
  const status = (from: number, until: number, last = false): AgentStepStatus => {
    if (last ? finished : at >= until) return "done";
    if (at < from) return "pending";
    return failed ? "error" : "running";
  };
  const hosts = state.sources.map((s) => `reading ${hostname(s.url)}`);
  return [
    { id: "plan", label: "Planning search queries", status: status(0, 1) },
    {
      id: "search",
      label: at >= 3 ? `Found ${state.sources.length} sources` : "Searching the web",
      status: status(1, 3),
      detail: state.queries.map((q) => `query: ${q}`),
    },
    { id: "write", label: "Writing the report", status: status(4, 5, true), detail: hosts },
  ];
}

/** Words the text loader cycles through while no report text has arrived. */
function loadingWords(state: AgentState) {
  if (state.stage === "synthesizing") return ["Writing…", "Citing sources…", "Structuring…"];
  if (state.stage === "searching" || state.stage === "searched") return ["Searching…", "Reading…", "Ranking…"];
  return ["Planning…", "Choosing queries…"];
}

// Outline button: hairline edge, 18px pill. Icon side gets 2px less padding.
const pill =
  "flex h-9 items-center gap-1.5 rounded-2xl border border-hairline bg-paper pr-3 pl-2.5 text-sm font-medium text-ink transition-[color,background-color,scale] duration-150 ease-out hover:bg-canvas motion-safe:enabled:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40";

export function ReportPanel({ state, onExport, onRetry, onStop, onNew }: ReportPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const running = state.phase === "running";
  const streaming = running && state.stage === "synthesizing";
  const hasReport = state.report.length > 0;
  const steps = useMemo(() => agentSteps(state), [state]);
  const words = loadingWords(state);

  // Follow the stream while tokens arrive, unless the user scrolled up to read.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !streaming) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [state.report, streaming]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(state.report);
      toast.success("Copied report to clipboard");
    } catch {
      toast.error("Clipboard unavailable");
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-hairline px-8 py-5">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-semibold text-ink">{state.topic}</h1>
          <p className="text-sm text-mid-gray">
            {running
              ? state.statusMessage || "Starting research…"
              : state.phase === "done"
                ? `${countWords(state.report).toLocaleString()} words · ${state.sources.length} sources`
                : "Research stopped"}
          </p>
        </div>
        {running ? (
          <button type="button" onClick={onStop} className={cn(pill, "hover:text-ember")}>
            <Square className="size-3.5 fill-current" /> Stop
          </button>
        ) : (
          <>
            <button type="button" onClick={copy} disabled={!hasReport} className={pill}>
              <Copy className="size-4" /> Copy
            </button>
            <button type="button" onClick={onExport} disabled={!hasReport} className={pill}>
              <Download className="size-4" /> Export
            </button>
            <button
              type="button"
              onClick={onNew}
              className="flex h-9 items-center gap-1.5 rounded-2xl bg-nvidia pr-4 pl-3.5 text-sm font-medium text-ink transition-[background-color,scale] duration-150 ease-out hover:bg-nvidia-hover motion-safe:active:scale-[0.97]"
            >
              <Plus className="size-4" /> New
            </button>
          </>
        )}
      </div>

      {/* Body */}
      <div ref={scrollRef} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-8">
          {state.errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-3xl border border-hairline bg-paper py-3 pr-3 pl-5 text-sm text-ink shadow-card">
              <AlertTriangle className="size-4 shrink-0 text-ember" />
              <span className="flex-1">{state.errorMessage}</span>
              <button type="button" onClick={onRetry} className={pill}>
                <RotateCcw className="size-4" /> Retry
              </button>
            </div>
          )}

          {state.queries.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {state.queries.map((query) => (
                <span
                  key={query}
                  className="max-w-full truncate rounded-2xl bg-canvas px-2 py-0.5 text-xs font-medium text-ink-soft"
                >
                  {query}
                </span>
              ))}
            </div>
          )}

          {state.live && (
            <div className="mb-8 rounded-3xl border border-hairline bg-surface-alt px-5 py-3">
              <AILoadingState steps={steps} />
            </div>
          )}

          {!hasReport && running && (
            <AITextLoading
              className="py-16 text-mid-gray"
              key={words[0]}
              label={state.statusMessage || "Starting research"}
              texts={words}
            />
          )}

          {hasReport && (
            <motion.article
              initial={{ opacity: 0, transform: reduceMotion ? "translateY(0px)" : "translateY(8px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="prose prose-neutral max-w-none prose-headings:font-semibold prose-headings:text-ink prose-h1:text-3xl prose-h2:mt-10 prose-h2:text-2xl prose-h3:text-lg prose-p:text-base prose-p:leading-7 prose-p:text-ink-soft prose-a:text-nvidia-text prose-a:decoration-nvidia prose-a:underline-offset-4 prose-strong:text-ink prose-code:rounded-md prose-code:bg-canvas prose-code:px-1.5 prose-code:font-normal prose-code:text-ink-soft prose-code:before:content-none prose-code:after:content-none prose-li:text-base prose-li:text-ink-soft prose-hr:border-hairline prose-th:text-sm prose-td:text-sm"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.report}</ReactMarkdown>
              {streaming && (
                <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse rounded-full bg-nvidia" />
              )}
            </motion.article>
          )}

          {state.sources.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-3 text-xs font-medium tracking-[0.6px] text-mid-gray uppercase">Sources</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {state.sources.map((source, index) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-2xl border border-hairline bg-paper px-4 py-3 transition-colors duration-150 hover:bg-surface-alt"
                  >
                    <span className="mt-0.5 font-mono text-xs text-mid-gray tabular-nums">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{source.title}</span>
                      <span className="block truncate text-xs text-mid-gray">{hostname(source.url)}</span>
                    </span>
                    <ExternalLink className="mt-0.5 size-4 shrink-0 text-mid-gray transition-colors duration-150 group-hover:text-nvidia-text" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
