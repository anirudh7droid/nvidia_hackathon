import os

from dotenv import load_dotenv

load_dotenv()

NEBIUS_API_KEY = os.getenv("NEBIUS_API_KEY", "")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY", "")
NEBIUS_BASE_URL = "https://api.studio.nebius.ai/v1/"
NEMOTRON_MODEL = os.getenv("NEMOTRON_MODEL", "nvidia/nemotron-3-super-120b-a12b")

if not NEBIUS_API_KEY:
    raise RuntimeError("NEBIUS_API_KEY is not set. Add it to backend/.env")
if not TAVILY_API_KEY:
    raise RuntimeError("TAVILY_API_KEY is not set. Add it to backend/.env")
