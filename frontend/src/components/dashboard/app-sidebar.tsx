"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  BarChart3,
  ChevronsLeft,
  FileText,
  History,
  LayoutDashboard,
  Plus,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format";
import type { SavedReport } from "@/lib/types";
import { EASE_IN_OUT } from "@/lib/motion";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export type View = "home" | "analytics" | "history" | "settings";

const NAV: { id: View; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Home", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

type AppSidebarProps = {
  view: View;
  onViewChange: (view: View) => void;
  collapsed: boolean;
  onToggle: () => void;
  onNewResearch: () => void;
  recent: SavedReport[];
  onOpenReport: (report: SavedReport) => void;
};

export function AppSidebar({
  view,
  onViewChange,
  collapsed,
  onToggle,
  onNewResearch,
  recent,
  onOpenReport,
}: AppSidebarProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 248 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.25, ease: EASE_IN_OUT }}
      className="relative flex h-full shrink-0 flex-col overflow-hidden bg-surface-alt"
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-nvidia text-ink">
          <Sparkles className="size-4" />
        </div>
        {!collapsed && (
          <span className="truncate text-base font-semibold tracking-[-0.4px]">DeepDive</span>
        )}
      </div>

      {/* New research */}
      <div className="px-3 pb-3">
        <SidebarItem
          collapsed={collapsed}
          label="New Research"
          icon={Plus}
          onClick={onNewResearch}
          className="bg-nvidia font-medium text-ink hover:bg-nvidia-hover hover:text-ink motion-safe:active:scale-[0.97]"
          shortcut="N"
        />
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col gap-0.5 px-3">
        {!collapsed && <SectionLabel>Workspace</SectionLabel>}
        {NAV.map((item) => (
          <SidebarItem
            key={item.id}
            collapsed={collapsed}
            label={item.label}
            icon={item.icon}
            active={view === item.id}
            onClick={() => onViewChange(item.id)}
          />
        ))}
      </nav>

      {/* Recent */}
      <div className="scrollbar-thin mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3">
        {!collapsed && (
          <>
            <SectionLabel>Recent</SectionLabel>
            {recent.length === 0 ? (
              <p className="px-3 py-1 text-sm text-mid-gray">No reports yet.</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {recent.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenReport(item)}
                    className="group flex h-9 items-center gap-2 rounded-2xl px-3 text-left text-sm text-mid-gray transition-colors duration-150 hover:bg-canvas hover:text-ink"
                  >
                    <FileText className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.topic}</span>
                    <span className="shrink-0 text-xs text-mid-gray">
                      {formatRelative(item.createdAt)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 flex-col gap-1 p-3">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-hairline bg-paper text-xs font-medium text-ink">
              NB
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink">Nebius AI Studio</div>
              <div className="truncate text-xs text-mid-gray">nemotron · tavily</div>
            </div>
          </div>
        )}
        <SidebarItem
          collapsed={collapsed}
          label={collapsed ? "Expand" : "Collapse"}
          icon={ChevronsLeft}
          onClick={onToggle}
          iconClassName={cn("transition-[rotate] duration-250 ease-in-out motion-reduce:transition-none", collapsed && "rotate-180")}
        />
      </div>
    </motion.aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-1 pb-2 text-xs font-medium tracking-[0.6px] text-mid-gray uppercase">
      {children}
    </div>
  );
}

type SidebarItemProps = {
  collapsed: boolean;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  className?: string;
  iconClassName?: string;
  shortcut?: string;
};

function SidebarItem({
  collapsed,
  label,
  icon: Icon,
  onClick,
  active,
  className,
  iconClassName,
  shortcut,
}: SidebarItemProps) {
  const reduceMotion = useReducedMotion();

  const button = (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 w-full items-center gap-3 rounded-2xl border border-transparent px-3 text-sm text-mid-gray transition-[color,background-color,scale] duration-150 ease-out hover:bg-canvas hover:text-ink",
        active && "font-medium text-ink hover:bg-transparent",
        className
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute -inset-px rounded-2xl border border-hairline bg-paper shadow-card"
          transition={reduceMotion ? { duration: 0 } : { duration: 0.25, ease: EASE_IN_OUT }}
        />
      )}
      <Icon className={cn("relative size-4 shrink-0", active && "text-nvidia-text", iconClassName)} />
      {!collapsed && <span className="relative flex-1 truncate text-left">{label}</span>}
      {!collapsed && shortcut && (
        <kbd className="relative rounded-md border border-ink/15 px-1.5 font-mono text-xs text-ink/60">
          {shortcut}
        </kbd>
      )}
    </button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
