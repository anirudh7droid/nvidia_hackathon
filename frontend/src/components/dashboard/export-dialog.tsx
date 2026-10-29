"use client";

import { useState } from "react";
import { Check, Copy, Download, FileCode2, FileJson, FileText, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/format";
import type { Source } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Format = "md" | "txt" | "json";

const FORMATS: { id: Format; label: string; hint: string; icon: typeof FileText; mime: string }[] = [
  { id: "md", label: "Markdown", hint: ".md", icon: FileCode2, mime: "text/markdown" },
  { id: "txt", label: "Plain text", hint: ".txt", icon: FileText, mime: "text/plain" },
  { id: "json", label: "JSON", hint: ".json", icon: FileJson, mime: "application/json" },
];

const fieldLabel = "text-xs font-medium tracking-[0.6px] text-mid-gray uppercase";

type ExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
  report: string;
  queries: string[];
  sources: Source[];
  onSaveToHistory: () => void;
  alreadySaved: boolean;
};

export function ExportDialog({
  open,
  onOpenChange,
  topic,
  report,
  queries,
  sources,
  onSaveToHistory,
  alreadySaved,
}: ExportDialogProps) {
  const [format, setFormat] = useState<Format>("md");
  // null = untouched, so the name follows the topic until the user edits it.
  const [customName, setCustomName] = useState<string | null>(null);
  const [includeSources, setIncludeSources] = useState(true);
  const filename = customName ?? slugify(topic);

  const handleOpenChange = (next: boolean) => {
    if (!next) setCustomName(null);
    onOpenChange(next);
  };

  const build = (): string => {
    const sourceList = sources.map((s, i) => `${i + 1}. ${s.title} — ${s.url}`).join("\n");
    if (format === "json") {
      return JSON.stringify(
        { topic, report, queries, sources: includeSources ? sources : undefined },
        null,
        2
      );
    }
    if (!includeSources || sources.length === 0) return report;
    return format === "md"
      ? `${report}\n\n---\n\n## Sources\n\n${sourceList}\n`
      : `${report}\n\nSOURCES\n${sourceList}\n`;
  };

  const download = () => {
    const meta = FORMATS.find((f) => f.id === format)!;
    const blob = new Blob([build()], { type: meta.mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename || "report"}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported", { description: link.download });
    handleOpenChange(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(build());
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Clipboard unavailable");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-5 sm:max-w-md">
        <DialogHeader className="gap-1 pr-8">
          <DialogTitle>Export report</DialogTitle>
          <DialogDescription className="truncate">{topic}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <span className={fieldLabel}>Format</span>
          <div className="grid grid-cols-3 gap-2">
            {FORMATS.map(({ id, label, hint, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={format === id}
                onClick={() => setFormat(id)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-2xl border px-3 py-2.5 text-left transition-[background-color,border-color,scale] duration-150 ease-out motion-safe:active:scale-[0.97]",
                  format === id
                    ? "border-nvidia bg-nvidia-tint"
                    : "border-hairline bg-paper hover:bg-surface-alt"
                )}
              >
                <Icon className={cn("size-4", format === id ? "text-nvidia-text" : "text-mid-gray")} />
                <span className="text-sm font-medium text-ink">{label}</span>
                <span className="font-mono text-xs text-mid-gray">{hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="export-filename" className={fieldLabel}>
            Filename
          </label>
          <div className="flex h-9 items-center rounded-2xl border border-transparent bg-canvas font-mono text-sm transition-[background-color,border-color] duration-150 ease-out focus-within:border-hairline focus-within:bg-paper">
            <input
              id="export-filename"
              value={filename}
              onChange={(e) => setCustomName(e.target.value)}
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-ink outline-none"
            />
            <span className="pr-3 text-mid-gray">.{format}</span>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink select-none">
          <span
            className={cn(
              "flex size-4 items-center justify-center rounded-sm border transition-colors duration-150",
              includeSources ? "border-nvidia bg-nvidia text-ink" : "border-hairline bg-paper"
            )}
          >
            {includeSources && <Check className="size-3" strokeWidth={3} />}
          </span>
          <input
            type="checkbox"
            className="sr-only"
            checked={includeSources}
            onChange={(e) => setIncludeSources(e.target.checked)}
          />
          Append source list ({sources.length})
        </label>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onSaveToHistory}
            disabled={alreadySaved}
            className="sm:mr-auto"
          >
            <Save className="size-4" />
            {alreadySaved ? "Saved to history" : "Save to history"}
          </Button>
          <Button variant="outline" onClick={copy}>
            <Copy className="size-4" /> Copy
          </Button>
          <Button onClick={download}>
            <Download className="size-4" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
