"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { AppSidebar, type View } from "@/components/dashboard/app-sidebar";
import AIPrompt from "@/components/kokonutui/ai-prompt";
import { QuickStart } from "@/components/dashboard/quick-start";
import { ReportPanel } from "@/components/dashboard/report-panel";
import { ExportDialog } from "@/components/dashboard/export-dialog";
import { AnalyticsView, HistoryView, SettingsView } from "@/components/dashboard/secondary-views";
import { useResearchAgent } from "@/lib/use-research-agent";
import { useHistory } from "@/lib/use-history";
import type { SavedReport } from "@/lib/types";
import { EASE_OUT } from "@/lib/motion";
import { DEFAULT_MODEL, type Depth } from "@/lib/research-options";

export default function Dashboard() {
  const { state, start, stop, reset, load } = useResearchAgent();
  const history = useHistory();
  const reduceMotion = useReducedMotion();

  const [view, setView] = useState<View>("home");
  const [collapsed, setCollapsed] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [depth, setDepth] = useState<Depth>("standard");
  const [exportOpen, setExportOpen] = useState(false);
  // startedAt of the run that has been saved, so "Save to history" is idempotent per run.
  const [savedRun, setSavedRun] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const running = state.phase === "running";

  const run = useCallback(
    (value: string) => {
      setView("home");
      start(value, { model, depth });
    },
    [start, model, depth]
  );

  const newResearch = useCallback(() => {
    reset();
    setView("home");
    setSavedRun(null);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [reset]);

  const openSaved = useCallback(
    (item: SavedReport) => {
      load(item);
      setSavedRun(item.createdAt - item.durationMs);
      setView("home");
    },
    [load]
  );

  const saveCurrent = useCallback(() => {
    if (!state.report || !state.startedAt) return;
    history.save({
      topic: state.topic,
      report: state.report,
      queries: state.queries,
      sources: state.sources,
      createdAt: state.finishedAt ?? Date.now(),
      durationMs: (state.finishedAt ?? Date.now()) - state.startedAt,
    });
    setSavedRun(state.startedAt);
    toast.success("Saved to history", { description: state.topic });
  }, [history, state]);

  // Phase-transition toasts.
  const prevPhase = useRef(state.phase);
  useEffect(() => {
    const prev = prevPhase.current;
    prevPhase.current = state.phase;
    if (prev !== "running") return;

    if (state.phase === "done") {
      toast.success("Report synthesized successfully", {
        description: `${state.sources.length} sources · ${state.queries.length} queries`,
        action: { label: "Export", onClick: () => setExportOpen(true) },
      });
    } else if (state.phase === "error") {
      if (state.errorMessage === "Cancelled by user.") {
        toast.info("Research cancelled");
      } else {
        const failedEarly = state.stage !== "synthesizing";
        toast.error(failedEarly ? "Research failed" : "Report synthesis failed", {
          description: state.errorMessage ?? undefined,
        });
      }
    }
  }, [state.phase, state.errorMessage, state.stage, state.sources.length, state.queries.length]);

  // Keyboard: ⌘K / Ctrl+K focuses the input, N starts a new research.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (state.phase !== "idle") newResearch();
        else {
          setView("home");
          requestAnimationFrame(() => inputRef.current?.focus());
        }
        return;
      }
      const target = event.target as HTMLElement;
      const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (!typing && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        newResearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newResearch, state.phase]);

  const contentKey = view === "home" ? (state.phase === "idle" ? "hero" : "report") : view;
  // Hero <-> report swaps the whole panel occasionally, so it gets a short rise.
  // Sidebar view switches happen all day, so they only cross-fade.
  const rise = (contentKey === "hero" || contentKey === "report") && !reduceMotion;

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-paper text-ink">
      <AppSidebar
        view={view}
        onViewChange={setView}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        onNewResearch={newResearch}
        recent={history.items}
        onOpenReport={openSaved}
      />

      <main className="relative m-3 ml-0 flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-hairline bg-paper shadow-card">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={contentKey}
            initial={{ opacity: 0, transform: rise ? "translateY(8px)" : "translateY(0px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: 0, transition: { duration: 0.1, ease: EASE_OUT } }}
            transition={{ duration: rise ? 0.25 : 0.15, ease: EASE_OUT }}
            className="min-h-0 flex-1"
          >
            {contentKey === "hero" && (
              <div className="scrollbar-thin flex h-full flex-col items-center justify-center-safe gap-10 overflow-y-auto px-6 py-12">
                <div className="text-center">
                  <h1 className="text-4xl font-semibold text-balance text-ink sm:text-5xl">
                    What can I help you research?
                  </h1>
                  <p className="mx-auto mt-4 max-w-md text-base text-pretty text-mid-gray">
                    An autonomous agent that plans, searches the web, and writes a cited report — powered by NVIDIA Nemotron.
                  </p>
                </div>
                <AIPrompt
                  className="max-w-2xl"
                  depth={depth}
                  model={model}
                  onDepthChange={setDepth}
                  onModelChange={setModel}
                  onStop={stop}
                  onSubmit={run}
                  ref={inputRef}
                  running={running}
                />
                <QuickStart onRun={run} />
              </div>
            )}

            {contentKey === "report" && (
              <ReportPanel
                state={state}
                onExport={() => setExportOpen(true)}
                onRetry={() => run(state.topic)}
                onStop={stop}
                onNew={newResearch}
              />
            )}

            {view !== "home" && (
              <div className="scrollbar-thin h-full overflow-y-auto p-5">
                {view === "history" && (
                  <HistoryView items={history.items} onOpen={openSaved} onRemove={history.remove} />
                )}
                {view === "analytics" && <AnalyticsView items={history.items} />}
                {view === "settings" && (
                  <SettingsView
                    historyCount={history.items.length}
                    onClearHistory={() => {
                      history.clear();
                      toast.success("History cleared");
                    }}
                  />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        topic={state.topic}
        report={state.report}
        queries={state.queries}
        sources={state.sources}
        onSaveToHistory={saveCurrent}
        alreadySaved={savedRun !== null && savedRun === state.startedAt}
      />
    </div>
  );
}
