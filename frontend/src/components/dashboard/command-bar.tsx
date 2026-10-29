"use client";

import { forwardRef, type FormEvent } from "react";
import { ArrowUp, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type CommandBarProps = {
  value: string;
  onValueChange: (value: string) => void;
  running: boolean;
  onSubmit: (topic: string) => void;
};

export const CommandBar = forwardRef<HTMLInputElement, CommandBarProps>(
  function CommandBar({ value, onValueChange, running, onSubmit }, ref) {
    const handleSubmit = (event: FormEvent) => {
      event.preventDefault();
      const topic = value.trim();
      if (!topic || running) return;
      onSubmit(topic);
    };

    const ready = value.trim().length > 0 && !running;

    return (
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex h-16 items-center gap-3 rounded-3xl border border-white/[0.08] bg-white/[0.04] pr-2.5 pl-5 shadow-[0_8px_40px_-12px_rgb(0_0_0/0.6)] backdrop-blur-xl transition-colors",
          "focus-within:border-[#76b900]/40 focus-within:bg-white/[0.06]"
        )}
      >
        <Search className="size-5 shrink-0 text-white/40" />
        <input
          ref={ref}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          disabled={running}
          maxLength={300}
          placeholder="Ask about any topic — markets, technologies, competitors…"
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/35 disabled:opacity-60"
        />
        <kbd className="hidden shrink-0 rounded-lg border border-white/[0.08] px-2 py-0.5 font-mono text-[11px] text-white/40 sm:block">
          ⌘K
        </kbd>
        <button
          type="submit"
          disabled={!ready}
          aria-label="Start research"
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#76b900] text-black transition-all hover:bg-[#86d100] hover:shadow-[0_0_24px_rgb(118_185_0/0.45)] disabled:bg-white/[0.06] disabled:text-white/30 disabled:shadow-none"
        >
          <ArrowUp className="size-5" />
        </button>
      </form>
    );
  }
);
