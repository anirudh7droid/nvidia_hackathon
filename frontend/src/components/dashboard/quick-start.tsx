"use client";

import { motion } from "framer-motion";
import { Layers, Microscope, Swords, TrendingUp, type LucideIcon } from "lucide-react";

type Template = {
  title: string;
  description: string;
  icon: LucideIcon;
  topic: string;
};

const TEMPLATES: Template[] = [
  {
    title: "Market Analysis",
    description: "Size, growth, key players",
    icon: TrendingUp,
    topic: "Current state and growth outlook of the AI inference chip market",
  },
  {
    title: "Tech Stack Review",
    description: "Maturity, risks, alternatives",
    icon: Layers,
    topic: "Technical review of Next.js 16 and FastAPI for production AI apps",
  },
  {
    title: "Competitor Deep Dive",
    description: "Products, pricing, positioning",
    icon: Swords,
    topic: "Competitive analysis of Nebius AI Studio versus AWS Bedrock",
  },
  {
    title: "Research Trends",
    description: "What's emerging now",
    icon: Microscope,
    topic: "Emerging trends in autonomous AI research agents in 2026",
  },
];

type QuickStartProps = {
  onRun: (topic: string) => void;
};

export function QuickStart({ onRun }: QuickStartProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {TEMPLATES.map((template, index) => {
        const Icon = template.icon;
        return (
          <motion.button
            key={template.title}
            type="button"
            onClick={() => onRun(template.topic)}
            title={template.topic}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + index * 0.06, ease: "easeOut" }}
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="group flex w-44 flex-col gap-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-left backdrop-blur-xl transition-colors hover:border-[#76b900]/30 hover:bg-white/[0.06]"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/[0.05] text-white/60 transition-colors group-hover:bg-[#76b900]/15 group-hover:text-[#76b900]">
              <Icon className="size-4" />
            </div>
            <div>
              <div className="text-[14px] font-medium text-white/90">{template.title}</div>
              <p className="mt-0.5 text-[12px] text-white/45">{template.description}</p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
