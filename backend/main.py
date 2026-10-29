import json
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from agent import run_agent
from config import DEFAULT_MODEL, DEPTH_QUERIES, Depth, Model

app = FastAPI(title="Autonomous Deep-Dive Research Agent")

# Wildcard origins are only valid without credentials; the API is cookie-free.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=300)
    model: Model = DEFAULT_MODEL
    depth: Depth = "standard"


async def research_stream(topic: str, model: str, depth: str) -> AsyncGenerator[dict, None]:
    """Run the agent and end every completed stream with a terminal [DONE] event."""
    try:
        async for event in run_agent(topic, model, DEPTH_QUERIES[depth]):
            yield event
    except Exception as exc:
        yield {"event": "error", "data": json.dumps({"message": f"Stream failed: {exc}"})}
    # Not in `finally`: when the client disconnects the generator is closed,
    # and yielding during that close raises RuntimeError.
    yield {"event": "end", "data": "[DONE]"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/research")
async def research(request: ResearchRequest):
    return EventSourceResponse(research_stream(request.topic, request.model, request.depth))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
