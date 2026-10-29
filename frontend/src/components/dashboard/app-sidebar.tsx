"use client";

import { motion } from "framer-motion";
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
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 248 }}
      transition={{ type: "spring", stiffness: 400, damping: 36 }}
      className="relative z-10 flex h-full shrink-0 flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl"
    >
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#76b900]/15 text-[#76b900]">
          <Sparkles className="size-4" />
        </div>
        {!collapsed && (
          <span className="truncate text-[16px] font-semibold tracking-tight">
            Deep<span className="text-[#76b900]">Dive</span>
          </span>
        )}
      </div>

      {/* New research */}
      <div className="px-3 pb-2">
        <SidebarItem
          collapsed={collapsed}
          label="New Research"
          icon={Plus}
          onClick={onNewResearch}
          className="border border-white/[0.08] bg-white/[0.05] text-white hover:bg-white/[0.09]"
          shortcut="N"
        />
      </div>

      {/* Primary nav */}
      <nav className="flex flex-col gap-1 px-3">
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
      <div className="scrollbar-thin mt-5 min-h-0 flex-1 overflow-y-auto px-3">
        {!collapsed && (
          <>
            <SectionLabel>Recent</SectionLabel>
            {recent.length === 0 ? (
              <p className="px-3 py-1 text-[13px] text-white/35">
                No reports yet.
              </p>
            ) : (
              <div className="flex flex-col gap-px">
                {recent.slice(0, 8).map((item) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenReport(item)}
                    whileHover={{ x: 2 }}
                    transition={{ duration: 0.12 }}
                    className="group flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white"
                  >
                    <FileText className="size-3.5 shrink-0 group-hover:text-[#76b900]" />
                    <span className="flex-1 truncate">{item.topic}</span>
                    <span className="shrink-0 text-[11px] text-white/30">
                      {formatRelative(item.createdAt)}
                    </span>
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex shrink-0 flex-col gap-1 border-t border-white/[0.06] p-3">
        {!collapsed && (
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#76b900]/15 text-[11px] font-medium text-[#76b900]">
              NB
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] text-white/85">Nebius AI Studio</div>
              <div className="truncate text-[11px] text-white/40">
                nemotron · tavily
              </div>
            </div>
          </div>
        )}
        <SidebarItem
          collapsed={collapsed}
          label={collapsed ? "Expand" : "Collapse"}
          icon={ChevronsLeft}
          onClick={onToggle}
          iconClassName={cn("transition-transform", collapsed && "rotate-180")}
        />
      </div>
    </motion.aside>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-1 pb-2 text-[11px] font-medium text-white/35">
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
  const button = (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12 }}
      className={cn(
        "relative flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[14px] text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white",
        active && "bg-white/[0.07] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]",
        className
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute top-2.5 bottom-2.5 left-0 w-1 rounded-full bg-[#76b900]"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
      <Icon className={cn("size-4 shrink-0", active && "text-[#76b900]", iconClassName)} />
      {!collapsed && <span className="flex-1 truncate text-left">{label}</span>}
      {!collapsed && shortcut && (
        <kbd className="rounded-md border border-white/[0.08] px-1.5 font-mono text-[10px] text-white/40">
          {shortcut}
        </kbd>
      )}
    </motion.button>
  );

  if (!collapsed) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
