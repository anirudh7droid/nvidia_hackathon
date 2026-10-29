import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PanelProps = {
  title?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
};

/** Frosted glass card with an optional header row. */
export function Panel({ title, icon: Icon, actions, className, bodyClassName, children }: PanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl",
        className
      )}
    >
      {title && (
        <div className="flex h-12 shrink-0 items-center gap-2 px-5">
          {Icon && <Icon className="size-4 text-white/50" />}
          <span className="text-[13px] font-medium text-white/70">{title}</span>
          {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
        </div>
      )}
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </div>
  );
}
