// Options the backend accepts on POST /api/research. Keep in sync with
// `Model` and `Depth` in backend/config.py.

export type ModelOption = {
  id: string;
  name: string;
  description: string;
};

export const MODELS: ModelOption[] = [
  {
    id: "nvidia/nemotron-3-super-120b-a12b",
    name: "Nemotron 3 Super",
    description: "120B · balanced default",
  },
  {
    id: "nvidia/Nemotron-3-Ultra-550b-a55b",
    name: "Nemotron 3 Ultra",
    description: "550B · most capable",
  },
  {
    id: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
    name: "Nemotron 3 Nano",
    description: "30B · fastest",
  },
  {
    id: "nvidia/Nemotron-3_5-Lightning",
    name: "Nemotron 3.5 Lightning",
    description: "Newest generation",
  },
];

export const DEFAULT_MODEL = MODELS[0].id;

export type Depth = "quick" | "standard" | "deep";

/** Lowest first, so the bars in the depth menu rise with the level. */
export const DEPTHS: { id: Depth; label: string; description: string }[] = [
  { id: "quick", label: "Quick", description: "2 web searches" },
  { id: "standard", label: "Standard", description: "3 web searches" },
  { id: "deep", label: "Deep", description: "5 web searches" },
];

export type ResearchOptions = { model: string; depth: Depth };

export const modelName = (id: string) =>
  MODELS.find((m) => m.id === id)?.name ?? id;
