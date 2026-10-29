"use client";

/**
 * Adapted from KokonutUI "AI Prompt" (MIT, https://kokonutui.com).
 * Trimmed to what the research agent uses: topic, model, depth, send/stop.
 * Attachments, slash commands and the promo header were removed because the
 * backend accepts none of them.
 */

import { ArrowUp, Check, ChevronDown, Cpu } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type Ref, useId, useImperativeHandle, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { EASE_OUT } from "@/lib/motion";
import { DEPTHS, type Depth, MODELS, modelName } from "@/lib/research-options";
import { cn } from "@/lib/utils";

type AIPromptProps = {
  ref?: Ref<HTMLTextAreaElement>;
  model: string;
  onModelChange: (model: string) => void;
  depth: Depth;
  onDepthChange: (depth: Depth) => void;
  /** True while a research run streams; the send button becomes Stop. */
  running: boolean;
  onSubmit: (topic: string) => void;
  onStop: () => void;
  placeholder?: string;
  className?: string;
};

const MAX_LENGTH = 300; // backend limit on `topic`

const ghostButton = cn(
  "flex h-8 items-center gap-1.5 rounded-2xl px-2.5 text-xs font-medium text-mid-gray",
  "transition-[background-color,color] duration-150 ease-out",
  "hover:bg-canvas hover:text-ink data-popup-open:bg-canvas data-popup-open:text-ink"
);

const menuLabel = "px-2 pt-1.5 pb-1 text-xs font-medium tracking-[0.6px] text-mid-gray uppercase";
const menuItem = "flex items-center gap-2.5 rounded-xl px-2 py-1.5";

/** Rising bars, filled up to the current depth, like a signal meter. */
function DepthBars({ level }: { level: number }) {
  return (
    <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
      {DEPTHS.map((d, i) => (
        <span
          className={cn(
            "w-[3px] rounded-[1px] transition-colors duration-200",
            i <= level ? "bg-nvidia" : "bg-hairline"
          )}
          key={d.id}
          style={{ height: `${((i + 1) / DEPTHS.length) * 100}%` }}
        />
      ))}
    </span>
  );
}

function ModelMenu({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button className={cn(ghostButton, "group pr-2")} type="button" />}>
        <Cpu aria-hidden="true" className="size-3.5 text-nvidia-text" />
        {/* Only the name swaps; the chevron stays put. */}
        <span className="relative inline-grid">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              animate={{ opacity: 1, filter: "blur(0px)" }}
              className="col-start-1 row-start-1 whitespace-nowrap"
              exit={{ opacity: 0, filter: "blur(2px)" }}
              initial={{ opacity: 0, filter: "blur(2px)" }}
              key={value}
              transition={{ duration: 0.15, ease: EASE_OUT }}
            >
              {modelName(value)}
            </motion.span>
          </AnimatePresence>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-3 opacity-50 transition-[rotate] duration-200 ease-out group-data-popup-open:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className={menuLabel}>Model</DropdownMenuLabel>
          {MODELS.map((model) => (
            <DropdownMenuItem className={menuItem} key={model.id} onClick={() => onChange(model.id)}>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{model.name}</span>
                <span className="block truncate text-xs text-mid-gray">{model.description}</span>
              </span>
              <Check
                aria-hidden="true"
                className={cn("size-4 shrink-0 text-nvidia-text", model.id !== value && "invisible")}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DepthMenu({ value, onChange }: { value: Depth; onChange: (depth: Depth) => void }) {
  const level = DEPTHS.findIndex((d) => d.id === value);
  const current = DEPTHS[level];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button aria-label={`Research depth: ${current.label}. Change`} className={ghostButton} type="button" />}
      >
        <DepthBars level={level} />
        {current.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className={menuLabel}>Depth</DropdownMenuLabel>
          {/* Deepest first, so the list reads like the bars: up is more. */}
          {[...DEPTHS].reverse().map((depth) => (
            <DropdownMenuItem className={menuItem} key={depth.id} onClick={() => onChange(depth.id)}>
              <DepthBars level={DEPTHS.indexOf(depth)} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink">{depth.label}</span>
                <span className="block text-xs text-mid-gray">{depth.description}</span>
              </span>
              <Check
                aria-hidden="true"
                className={cn("size-4 shrink-0 text-nvidia-text", depth.id !== value && "invisible")}
              />
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SendButton({ running, canSend, onSend, onStop }: {
  running: boolean;
  canSend: boolean;
  onSend: () => void;
  onStop: () => void;
}) {
  // One button with two faces that cross-fade, so Send turning into Stop
  // reads as the same control changing state.
  const face = "absolute inset-0 flex items-center justify-center transition-[opacity,filter] duration-200 ease-out";
  return (
    <button
      aria-label={running ? "Stop research" : "Start research"}
      className={cn(
        "relative size-9 shrink-0 rounded-full transition-[background-color,color,scale] duration-150 ease-out motion-safe:enabled:active:scale-[0.97]",
        running || canSend ? "bg-nvidia text-ink hover:bg-nvidia-hover" : "bg-canvas text-mid-gray"
      )}
      disabled={!(running || canSend)}
      onClick={running ? onStop : onSend}
      type="button"
    >
      <span aria-hidden="true" className={cn(face, running ? "opacity-0 blur-[2px]" : "opacity-100 blur-0")}>
        <ArrowUp className="size-4" strokeWidth={2.25} />
      </span>
      <span aria-hidden="true" className={cn(face, running ? "opacity-100 blur-0" : "opacity-0 blur-[2px]")}>
        <span className="size-2.5 rounded-[2px] bg-current" />
      </span>
    </button>
  );
}

export default function AIPrompt({
  ref,
  model,
  onModelChange,
  depth,
  onDepthChange,
  running,
  onSubmit,
  onStop,
  placeholder = "Ask about any topic — markets, technologies, competitors…",
  className,
}: AIPromptProps) {
  const [value, setValue] = useState("");
  const textareaId = useId();
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 56, maxHeight: 200 });

  // The parent focuses the field from its ⌘K shortcut.
  useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement, [textareaRef]);

  const topic = value.trim();
  const canSend = topic.length > 0 && !running;

  const submit = () => {
    if (!canSend) return;
    onSubmit(topic);
    setValue("");
    adjustHeight(true);
  };

  return (
    <div
      className={cn(
        "w-full rounded-3xl border border-hairline bg-paper shadow-card",
        "transition-[border-color] duration-150 ease-out focus-within:border-nvidia",
        className
      )}
    >
      <label className="sr-only" htmlFor={textareaId}>
        Research topic
      </label>
      <textarea
        className="block w-full resize-none bg-transparent px-5 pt-4 pb-1 text-base text-ink outline-none placeholder:text-mid-gray"
        id={textareaId}
        maxLength={MAX_LENGTH}
        onChange={(e) => {
          setValue(e.target.value);
          adjustHeight();
        }}
        onKeyDown={(e) => {
          // Enter during IME composition confirms the candidate; it must not submit.
          if (e.nativeEvent.isComposing) return;
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape" && running) {
            e.preventDefault();
            onStop();
          }
        }}
        placeholder={placeholder}
        ref={textareaRef}
        rows={1}
        value={value}
      />
      <div className="flex items-center gap-1 px-3 pt-1 pb-3">
        <ModelMenu onChange={onModelChange} value={model} />
        <DepthMenu onChange={onDepthChange} value={depth} />
        <div className="flex-1" />
        <kbd className="mr-2 hidden rounded-md border border-hairline px-1.5 py-0.5 font-mono text-xs text-mid-gray sm:block">
          ⌘K
        </kbd>
        <SendButton canSend={canSend} onSend={submit} onStop={onStop} running={running} />
      </div>
    </div>
  );
}
