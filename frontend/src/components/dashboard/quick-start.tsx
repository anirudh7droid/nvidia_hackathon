"use client";

import { ArrowRight, Layers, Microscope, Repeat2, Swords, TrendingUp, type LucideIcon } from "lucide-react";
import FlickCard from "@/components/kokonutui/flick-card";

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

/** Template cards: the front names the template, the back shows its prompt. */
export function QuickStart({ onRun }: QuickStartProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 pb-6">
      {TEMPLATES.map((template) => {
        const Icon = template.icon;
        return (
          <FlickCard
            back={
              <div className="flex h-full flex-col p-5">
                <span className="text-xs font-medium tracking-[0.6px] text-mid-gray uppercase">Prompt</span>
                <p className="mt-2 text-sm text-pretty text-ink">{template.topic}</p>
                <button
                  className="mt-auto flex h-9 items-center justify-center gap-1.5 rounded-2xl bg-nvidia text-sm font-medium text-ink transition-[background-color,scale] duration-150 ease-out hover:bg-nvidia-hover motion-safe:active:scale-[0.97]"
                  onClick={() => onRun(template.topic)}
                  type="button"
                >
                  Run research <ArrowRight className="size-4" />
                </button>
              </div>
            }
            className="aspect-[4/5] w-[176px]"
            front={
              <div className="flex h-full flex-col p-5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-nvidia-tint text-nvidia-text">
                  <Icon className="size-4" />
                </div>
                <div className="mt-auto">
                  <div className="text-sm font-semibold text-ink">{template.title}</div>
                  <p className="mt-0.5 text-sm text-mid-gray">{template.description}</p>
                  <p className="mt-3 flex items-center gap-1 text-xs text-mid-gray">
                    <Repeat2 aria-hidden="true" className="size-3.5" /> Flip for the prompt
                  </p>
                </div>
              </div>
            }
            key={template.title}
            label={`${template.title} template`}
          />
        );
      })}
    </div>
  );
}
