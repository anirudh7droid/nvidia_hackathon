import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv

# Resolve .env next to this file, so the server starts from any working directory.
load_dotenv(Path(__file__).resolve().parent / ".env")

NEBIUS_API_KEY = os.getenv("NEBIUS_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
NEBIUS_BASE_URL = "https://api.studio.nebius.ai/v1/"

# Nemotron models the client may pick. Each was checked against Nebius AI Studio.
Model = Literal[
    "nvidia/nemotron-3-super-120b-a12b",
    "nvidia/Nemotron-3-Ultra-550b-a55b",
    "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
    "nvidia/Nemotron-3_5-Lightning",
]
DEFAULT_MODEL: Model = "nvidia/nemotron-3-super-120b-a12b"

# Research depth: how many web search queries the planner writes.
Depth = Literal["quick", "standard", "deep"]
DEPTH_QUERIES: dict[str, int] = {"quick": 2, "standard": 3, "deep": 5}

if not NEBIUS_API_KEY:
    raise RuntimeError("NEBIUS_API_KEY is not set. Add it to backend/.env")
if not TAVILY_API_KEY:
    raise RuntimeError("TAVILY_API_KEY is not set. Add it to backend/.env")
