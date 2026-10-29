"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AlertTriangle, Copy, Download, ExternalLink, Plus, RotateCcw, Square } from "lucide-react";
import { toast } from "sonner";
import { countWords, hostname } from "@/lib/format";
import type { AgentState } from "@/lib/use-research-agent";
import { cn } from "@/lib/utils";

type ReportPanelProps = {
  state: AgentState;
  onExport: () => void;
  onRetry: () => void;
  onStop: () => void;
  onNew: () => void;
};

const pill =
  "flex h-9 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-40";

export function ReportPanel({ state, onExport, onRetry, onStop, onNew }: ReportPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const running = state.phase === "running";
  const streaming = running && state.stage === "synthesizing";
  const hasReport = state.report.length > 0;

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex h-full flex-col"
    >
      {/* Header */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/[0.06] px-8 py-5">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-semibold tracking-tight text-white">{state.topic}</h1>
          <p className={cn("mt-0.5 text-[13px] text-white/45", running && "animate-pulse")}>
            {running
              ? state.statusMessage || "Starting research…"
              : state.phase === "done"
                ? `${countWords(state.report).toLocaleString()} words · ${state.sources.length} sources`
                : "Research stopped"}
          </p>
        </div>
        {running ? (
          <button type="button" onClick={onStop} className={cn(pill, "hover:text-red-300")}>
            <Square className="size-3.5 fill-current" /> Stop
          </button>
        ) : (
          <>
            <button type="button" onClick={copy} disabled={!hasReport} className={pill}>
              <Copy className="size-3.5" /> Copy
            </button>
            <button type="button" onClick={onExport} disabled={!hasReport} className={pill}>
              <Download className="size-3.5" /> Export
            </button>
            <button
              type="button"
              onClick={onNew}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-[#76b900] px-3.5 text-[13px] font-medium text-black transition-colors hover:bg-[#86d100]"
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
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/[0.08] px-4 py-3 text-[13px] text-red-200 backdrop-blur-xl">
              <AlertTriangle className="size-4 shrink-0" />
              <span className="flex-1">{state.errorMessage}</span>
              <button type="button" onClick={onRetry} className={cn(pill, "h-8")}>
                <RotateCcw className="size-3.5" /> Retry
              </button>
            </div>
          )}

          {state.queries.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {state.queries.map((query) => (
                <span
                  key={query}
                  className="max-w-full truncate rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[12px] text-white/55"
                >
                  {query}
                </span>
              ))}
            </div>
          )}

          {!hasReport && running && (
            <div className="flex flex-col gap-3">
              {[92, 78, 85, 60, 88, 70].map((width, i) => (
                <motion.div
                  key={i}
                  className="h-3 rounded-full bg-white/[0.06]"
                  style={{ width: `${width}%` }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.12 }}
                />
              ))}
            </div>
          )}

          {hasReport && (
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="prose prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h1:text-2xl prose-h2:mt-10 prose-h2:text-lg prose-h3:text-base prose-p:text-[15px] prose-p:leading-7 prose-p:text-white/75 prose-a:text-[#76b900] prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-code:rounded-md prose-code:bg-white/[0.06] prose-code:px-1.5 prose-code:text-[#9be22d] prose-code:before:content-none prose-code:after:content-none prose-li:text-[15px] prose-li:text-white/75 prose-hr:border-white/[0.08] prose-th:text-[13px] prose-td:text-[13px]"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.report}</ReactMarkdown>
              {streaming && (
                <motion.span
                  className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 rounded-full bg-[#76b900]"
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
                />
              )}
            </motion.article>
          )}

          {state.sources.length > 0 && (
            <div className="mt-12">
              <h2 className="mb-3 text-[13px] font-medium text-white/50">Sources</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {state.sources.map((source, index) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/[0.12] hover:bg-white/[0.05]"
                  >
                    <span className="mt-0.5 font-mono text-[11px] text-white/35">{index + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-white/85">{source.title}</span>
                      <span className="block truncate text-[12px] text-white/40">{hostname(source.url)}</span>
                    </span>
                    <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-white/30 transition-colors group-hover:text-[#76b900]" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
