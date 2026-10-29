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

/** Paper card: hairline border plus the card shadow, with an optional header row. */
export function Panel({ title, icon: Icon, actions, className, bodyClassName, children }: PanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl border border-hairline bg-paper shadow-card",
        className
      )}
    >
      {title && (
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-hairline px-5">
          {Icon && <Icon className="size-4 text-mid-gray" />}
          <span className="text-sm font-medium text-ink">{title}</span>
          {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
        </div>
      )}
      <div className={cn("min-h-0 flex-1", bodyClassName)}>{children}</div>
    </div>
  );
}
