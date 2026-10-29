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
      <DialogContent className="gap-3 rounded-3xl border border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-xl ring-0 sm:max-w-md">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-[14px]">Export report</DialogTitle>
          <DialogDescription className="truncate text-[12px]">{topic}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] tracking-wider text-muted-foreground uppercase">Format</label>
          <div className="grid grid-cols-3 gap-1.5">
            {FORMATS.map(({ id, label, hint, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFormat(id)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-xl border px-2.5 py-2 text-left transition-colors",
                  format === id
                    ? "border-[#76b900]/60 bg-[#76b900]/10"
                    : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]"
                )}
              >
                <Icon className={cn("size-3.5", format === id ? "text-[#76b900]" : "text-muted-foreground")} />
                <span className="text-[12px] text-foreground">{label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="export-filename" className="text-[10px] tracking-wider text-muted-foreground uppercase">
            Filename
          </label>
          <div className="flex h-8 items-center rounded-xl border border-white/[0.08] bg-white/[0.03] font-mono text-[12px] focus-within:border-[#76b900]/60">
            <input
              id="export-filename"
              value={filename}
              onChange={(e) => setCustomName(e.target.value)}
              className="h-full min-w-0 flex-1 bg-transparent px-2.5 outline-none"
            />
            <span className="pr-2.5 text-muted-foreground">.{format}</span>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground select-none">
          <span
            className={cn(
              "flex size-3.5 items-center justify-center rounded-sm border",
              includeSources ? "border-[#76b900] bg-[#76b900] text-black" : "border-[#3a3a3a]"
            )}
          >
            {includeSources && <Check className="size-2.5" strokeWidth={3} />}
          </span>
          <input
            type="checkbox"
            className="sr-only"
            checked={includeSources}
            onChange={(e) => setIncludeSources(e.target.checked)}
          />
          Append source list ({sources.length})
        </label>

        <DialogFooter className="-mx-4 -mb-4 border-white/[0.08] bg-white/[0.02] px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSaveToHistory}
            disabled={alreadySaved}
            className="h-7 gap-1.5 text-[12px] sm:mr-auto"
          >
            <Save className="size-3.5" />
            {alreadySaved ? "Saved to history" : "Save to history"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={copy}
            className="h-7 gap-1.5 border-white/[0.08] bg-transparent text-[12px]"
          >
            <Copy className="size-3.5" /> Copy
          </Button>
          <Button
            size="sm"
            onClick={download}
            className="h-7 gap-1.5 bg-[#1d4ed8] text-[12px] text-white hover:bg-[#2b5cf0]"
          >
            <Download className="size-3.5" /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
