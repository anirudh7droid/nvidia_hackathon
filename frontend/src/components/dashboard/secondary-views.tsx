"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Database, FileText, History, Server, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/stream-research";
import { countWords, formatDuration, formatRelative, hostname } from "@/lib/format";
import type { SavedReport } from "@/lib/types";
import { Panel } from "./panel";

/* ---------------------------------- History --------------------------------- */

type HistoryViewProps = {
  items: SavedReport[];
  onOpen: (item: SavedReport) => void;
  onRemove: (id: string) => void;
};

export function HistoryView({ items, onOpen, onRemove }: HistoryViewProps) {
  return (
    <Panel
      title="Saved Reports"
      icon={History}
      className="h-full"
      bodyClassName="scrollbar-thin overflow-auto"
      actions={<span className="font-mono text-[10px] text-muted-foreground">{items.length}</span>}
    >
      {items.length === 0 ? (
        <Empty>Nothing saved yet. Use Export → Save to history after a run.</Empty>
      ) : (
        <table className="w-full text-left text-[12px]">
          <thead className="sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-xl text-[10px] tracking-wider text-muted-foreground uppercase">
            <tr className="border-b border-white/[0.08]">
              <th className="px-3 py-2 font-medium">Topic</th>
              <th className="px-3 py-2 text-right font-medium">Sources</th>
              <th className="px-3 py-2 text-right font-medium">Words</th>
              <th className="px-3 py-2 text-right font-medium">Duration</th>
              <th className="px-3 py-2 text-right font-medium">Saved</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {items.map((item) => (
              <motion.tr
                key={item.id}
                whileHover={{ backgroundColor: "#1a1a1a" }}
                transition={{ duration: 0.1 }}
                onClick={() => onOpen(item)}
                className="group cursor-pointer"
              >
                <td className="max-w-0 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <FileText className="size-3 shrink-0 text-muted-foreground group-hover:text-[#76b900]" />
                    <span className="truncate text-foreground/90">{item.topic}</span>
                  </div>
                </td>
                <Num>{item.sources.length}</Num>
                <Num>{countWords(item.report).toLocaleString()}</Num>
                <Num>{formatDuration(item.durationMs)}</Num>
                <Num>{formatRelative(item.createdAt)}</Num>
                <td className="px-2">
                  <button
                    type="button"
                    aria-label="Delete report"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    className="rounded p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

/* --------------------------------- Analytics -------------------------------- */

export function AnalyticsView({ items }: { items: SavedReport[] }) {
  const n = items.length;
  const avg = (fn: (r: SavedReport) => number) =>
    n ? items.reduce((sum, r) => sum + fn(r), 0) / n : 0;

  const kpis = [
    { label: "Reports", value: n.toString() },
    { label: "Avg sources", value: avg((r) => r.sources.length).toFixed(1) },
    { label: "Avg words", value: Math.round(avg((r) => countWords(r.report))).toLocaleString() },
    { label: "Avg duration", value: n ? formatDuration(Math.round(avg((r) => r.durationMs))) : "—" },
  ];

  const domains = new Map<string, number>();
  for (const item of items) {
    for (const source of item.sources) {
      const host = hostname(source.url);
      domains.set(host, (domains.get(host) ?? 0) + 1);
    }
  }
  const topDomains = [...domains.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxCount = topDomains[0]?.[1] ?? 1;

  const recent = items.slice(0, 12).reverse();
  const maxWords = Math.max(1, ...recent.map((r) => countWords(r.report)));

  return (
    <div className="grid h-full grid-cols-1 grid-rows-[auto_1fr] gap-3 lg:grid-cols-2">
      <Panel className="lg:col-span-2">
        <div className="grid grid-cols-2 divide-white/[0.08] sm:grid-cols-4 sm:divide-x">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="px-4 py-3">
              <div className="text-[10px] tracking-wider text-muted-foreground uppercase">{kpi.label}</div>
              <div className="mt-0.5 font-mono text-xl tabular-nums">{kpi.value}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Top source domains" icon={Database} bodyClassName="scrollbar-thin overflow-auto p-3">
        {topDomains.length === 0 ? (
          <Empty>Save a few reports to see source coverage.</Empty>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {topDomains.map(([host, count]) => (
              <li key={host} className="grid grid-cols-[minmax(0,10rem)_1fr_2rem] items-center gap-2">
                <span className="truncate font-mono text-[11px] text-foreground/85">{host}</span>
                <div className="h-2 rounded-sm bg-[#1f1f1f]">
                  <motion.div
                    className="h-full rounded-sm bg-[#76b900]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCount) * 100}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
                <span className="text-right font-mono text-[11px] tabular-nums text-muted-foreground">
                  {count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Report length (last 12)" icon={BarChart3} bodyClassName="flex flex-col p-3">
        {recent.length === 0 ? (
          <Empty>No data yet.</Empty>
        ) : (
          <div className="flex min-h-40 flex-1 items-end gap-1.5">
            {recent.map((item) => {
              const words = countWords(item.report);
              return (
                <div key={item.id} className="group flex h-full flex-1 flex-col justify-end" title={`${item.topic} — ${words} words`}>
                  <motion.div
                    className="w-full rounded-t-sm bg-[#1d4ed8] transition-colors group-hover:bg-[#3b6cf0]"
                    initial={{ height: 0 }}
                    animate={{ height: `${(words / maxWords) * 100}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </div>
  );
}

/* --------------------------------- Settings --------------------------------- */

export function SettingsView({ historyCount, onClearHistory }: { historyCount: number; onClearHistory: () => void }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="grid max-w-3xl grid-cols-1 gap-3">
      <Panel title="Backend" icon={Server} bodyClassName="divide-y divide-white/[0.05]">
        <Row label="API base URL" value={API_BASE_URL} hint="Set NEXT_PUBLIC_API_BASE_URL in .env.local" />
        <Row label="Research endpoint" value="POST /api/research (SSE)" />
        <Row label="LLM provider" value="Nebius AI Studio · Nemotron" />
        <Row label="Search provider" value="Tavily" />
      </Panel>

      <Panel title="Local data" icon={Database}>
        <div className="flex items-center gap-3 px-3 py-3">
          <div className="flex-1">
            <div className="text-[12.5px]">Report history</div>
            <div className="text-[11px] text-muted-foreground">
              {historyCount} report{historyCount === 1 ? "" : "s"} stored in this browser.
            </div>
          </div>
          {confirming ? (
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" className="h-7 text-[12px]" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-[12px]"
                onClick={() => {
                  onClearHistory();
                  setConfirming(false);
                }}
              >
                Confirm clear
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={historyCount === 0}
              className="h-7 border-white/[0.08] bg-transparent text-[12px] hover:border-red-500/50 hover:text-red-400"
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="size-3" /> Clear history
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}

/* --------------------------------- helpers ---------------------------------- */

function Num({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-right font-mono text-[11px] tabular-nums text-muted-foreground">{children}</td>;
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] items-baseline gap-3 px-3 py-2">
      <span className="text-[11.5px] text-muted-foreground">{label}</span>
      <span className="min-w-0">
        <span className="block truncate font-mono text-[11.5px]">{value}</span>
        {hint && <span className="block text-[10.5px] text-muted-foreground/70">{hint}</span>}
      </span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-3 py-8 text-center text-[11.5px] text-muted-foreground/70">{children}</div>;
}
