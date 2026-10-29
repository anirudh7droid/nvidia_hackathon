"use client";

import { useState } from "react";
import { BarChart3, Database, FileText, History, Server, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/stream-research";
import { countWords, formatDuration, formatRelative, hostname } from "@/lib/format";
import type { SavedReport } from "@/lib/types";
import ActivityTerrain from "@/components/kokonutui/activity-terrain";
import { Panel } from "./panel";

const caption = "text-xs font-medium tracking-[0.6px] text-mid-gray uppercase";

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
      bodyClassName="scrollbar-thin overflow-auto overscroll-contain"
      actions={
        <span className="rounded-2xl bg-canvas px-2 py-0.5 text-xs font-medium text-ink-soft tabular-nums">
          {items.length}
        </span>
      }
    >
      {items.length === 0 ? (
        <Empty>Nothing saved yet. Use Export → Save to history after a run.</Empty>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-paper/95 backdrop-blur-sm">
            <tr className="border-b border-hairline">
              <th className={`px-5 py-2.5 ${caption}`}>Topic</th>
              <th className={`px-3 py-2.5 text-right ${caption}`}>Sources</th>
              <th className={`px-3 py-2.5 text-right ${caption}`}>Words</th>
              <th className={`px-3 py-2.5 text-right ${caption}`}>Duration</th>
              <th className={`px-3 py-2.5 text-right ${caption}`}>Saved</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {items.map((item) => (
              <tr
                key={item.id}
                onClick={() => onOpen(item)}
                className="group cursor-pointer transition-colors duration-100 hover:bg-surface-alt"
              >
                <td className="max-w-0 py-2.5 pr-3 pl-5">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 shrink-0 text-mid-gray group-hover:text-nvidia-text" />
                    <span className="truncate text-ink">{item.topic}</span>
                  </div>
                </td>
                <Num>{item.sources.length}</Num>
                <Num>{countWords(item.report).toLocaleString()}</Num>
                <Num>{formatDuration(item.durationMs)}</Num>
                <Num>{formatRelative(item.createdAt)}</Num>
                <td className="pr-3">
                  <button
                    type="button"
                    aria-label="Delete report"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    className="flex size-7 items-center justify-center rounded-2xl text-mid-gray transition-[opacity,color,background-color] duration-150 hover:bg-canvas hover:text-ember focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Panel>
  );
}

/* --------------------------------- Analytics -------------------------------- */

const ACTIVITY_DAYS = 26 * 7;

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Reports saved per local day, oldest first, ending today. */
function dailyActivity(items: SavedReport[]) {
  const perDay = new Map<string, number>();
  for (const item of items) {
    const key = dayKey(new Date(item.createdAt));
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }
  const today = new Date();
  const data = Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (ACTIVITY_DAYS - 1 - i));
    return perDay.get(dayKey(day)) ?? 0;
  });
  return { data, endDate: dayKey(today) };
}

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

  const activity = dailyActivity(items);

  const recent = items.slice(0, 12).reverse();
  const maxWords = Math.max(1, ...recent.map((r) => countWords(r.report)));

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Stat blocks: typography only, no card chrome. */}
      <div className="grid grid-cols-2 gap-5 px-1 pt-1 sm:grid-cols-4 lg:col-span-2">
        {kpis.map((kpi) => (
          <div key={kpi.label}>
            <div className={caption}>{kpi.label}</div>
            <div className="mt-1 text-3xl font-semibold text-ink tabular-nums">{kpi.value}</div>
          </div>
        ))}
      </div>

      <ActivityTerrain
        className="lg:col-span-2"
        data={activity.data}
        endDate={activity.endDate}
        title="Research activity"
        unit={["report", "reports"]}
      />

      <Panel title="Top source domains" icon={Database} className="min-h-72" bodyClassName="scrollbar-thin overflow-auto p-5">
        {topDomains.length === 0 ? (
          <Empty>Save a few reports to see source coverage.</Empty>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {topDomains.map(([host, count]) => (
              <li key={host} className="grid grid-cols-[minmax(0,10rem)_1fr_2rem] items-center gap-3">
                <span className="truncate text-sm text-ink">{host}</span>
                <div className="h-2 rounded-full bg-canvas">
                  <div
                    className="h-full rounded-full bg-nvidia"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-right text-sm text-mid-gray tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Report length (last 12)" icon={BarChart3} className="min-h-72" bodyClassName="flex flex-col p-5">
        {recent.length === 0 ? (
          <Empty>No data yet.</Empty>
        ) : (
          <div className="flex min-h-40 flex-1 items-end gap-2">
            {recent.map((item) => {
              const words = countWords(item.report);
              return (
                <div
                  key={item.id}
                  className="group flex h-full max-w-12 flex-1 flex-col justify-end"
                  title={`${item.topic} — ${words} words`}
                >
                  <div
                    className="w-full rounded-t-md bg-nvidia transition-colors duration-150 group-hover:bg-nvidia-hover"
                    style={{ height: `${(words / maxWords) * 100}%` }}
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
    <div className="grid max-w-3xl grid-cols-1 gap-5">
      <Panel title="Backend" icon={Server} bodyClassName="divide-y divide-hairline">
        <Row label="API base URL" value={API_BASE_URL} hint="Set NEXT_PUBLIC_API_BASE_URL in .env.local" />
        <Row label="Research endpoint" value="POST /api/research (SSE)" />
        <Row label="LLM provider" value="Nebius AI Studio · Nemotron" />
        <Row label="Search provider" value="Tavily" />
      </Panel>

      <Panel title="Local data" icon={Database}>
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="flex-1">
            <div className="text-sm font-medium text-ink">Report history</div>
            <div className="text-sm text-mid-gray">
              {historyCount} report{historyCount === 1 ? "" : "s"} stored in this browser.
            </div>
          </div>
          {confirming ? (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
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
              variant="outline"
              disabled={historyCount === 0}
              className="hover:text-ember"
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="size-4" /> Clear history
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}

/* --------------------------------- helpers ---------------------------------- */

function Num({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2.5 text-right text-sm text-mid-gray tabular-nums">{children}</td>;
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] items-baseline gap-3 px-5 py-3">
      <span className="text-sm text-mid-gray">{label}</span>
      <span className="min-w-0">
        <span className="block truncate font-mono text-sm text-ink">{value}</span>
        {hint && <span className="block text-xs text-mid-gray">{hint}</span>}
      </span>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-10 text-center text-sm text-mid-gray">{children}</div>;
}
