import asyncio
import json
import re
from typing import AsyncGenerator

from openai import AsyncOpenAI
from tavily import TavilyClient

from config import NEBIUS_API_KEY, NEBIUS_BASE_URL, TAVILY_API_KEY

llm = AsyncOpenAI(api_key=NEBIUS_API_KEY, base_url=NEBIUS_BASE_URL)
tavily = TavilyClient(api_key=TAVILY_API_KEY)

MAX_RESULTS_PER_QUERY = 5
SOURCE_CONTENT_CHARS = 2000
# Nemotron 3 models reason before answering by default; that burns the token budget
# and delays the first streamed token, so answer directly.
NO_THINKING = {"chat_template_kwargs": {"enable_thinking": False}}


def _sse(event: str, data: dict) -> dict:
    return {"event": event, "data": json.dumps(data)}


def _extract_json_array(text: str) -> list[str] | None:
    match = re.search(r"\[.*\]", text, re.DOTALL)
    if not match:
        return None
    try:
        parsed = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
    if not isinstance(parsed, list):
        return None
    queries = [str(item).strip() for item in parsed if str(item).strip()]
    return queries or None


async def plan_queries(topic: str, model: str, max_queries: int) -> list[str]:
    try:
        response = await llm.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a research query planner. Given a topic, produce "
                        f"exactly {max_queries} specific, diverse web search queries "
                        "that together cover the topic well. Respond with ONLY a JSON "
                        'array of strings, e.g. ["query one", "query two", "query three"]. '
                        "No prose, no markdown fences."
                    ),
                },
                {"role": "user", "content": topic},
            ],
            temperature=0.3,
            max_tokens=300,
            extra_body=NO_THINKING,
        )
        content = response.choices[0].message.content or ""
    except Exception:
        content = ""

    queries = _extract_json_array(content)
    if not queries:
        queries = [topic, f"{topic} latest developments", f"{topic} analysis and impact"]
    return queries[:max_queries]


async def search_web(queries: list[str]) -> list[dict]:
    async def run_one(query: str) -> list[dict]:
        try:
            result = await asyncio.to_thread(
                tavily.search,
                query=query,
                search_depth="advanced",
                max_results=MAX_RESULTS_PER_QUERY,
            )
        except Exception:
            return []
        return result.get("results", []) if isinstance(result, dict) else []

    batches = await asyncio.gather(*(run_one(q) for q in queries))

    sources: list[dict] = []
    seen_urls: set[str] = set()
    for batch in batches:
        for item in batch:
            url = item.get("url")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            sources.append(
                {
                    "title": item.get("title") or url,
                    "url": url,
                    "content": (item.get("content") or "")[:SOURCE_CONTENT_CHARS],
                }
            )
    return sources


def _build_context(sources: list[dict]) -> str:
    blocks = []
    for idx, source in enumerate(sources, start=1):
        blocks.append(f"[{idx}] {source['title']} ({source['url']})\n{source['content']}")
    return "\n\n".join(blocks)


async def run_agent(topic: str, model: str, max_queries: int) -> AsyncGenerator[dict, None]:
    topic = topic.strip()
    if not topic:
        yield _sse("error", {"message": "Topic must not be empty."})
        return

    try:
        yield _sse("status", {"stage": "planning", "message": "Agent is planning research queries..."})
        try:
            queries = await plan_queries(topic, model, max_queries)
        except Exception as exc:
            yield _sse("error", {"message": f"Nebius query planning failed: {exc}"})
            return
        yield _sse("status", {"stage": "planned", "message": "Queries ready.", "queries": queries})

        yield _sse(
            "status",
            {"stage": "searching", "message": f"Searching the web across {len(queries)} queries..."},
        )
        try:
            sources = await search_web(queries)
        except Exception as exc:
            yield _sse("error", {"message": f"Tavily search failed: {exc}"})
            return

        if not sources:
            yield _sse(
                "error",
                {"message": "No sources were found for this topic. Try rephrasing your query."},
            )
            return

        yield _sse(
            "status",
            {
                "stage": "searched",
                "message": f"Found {len(sources)} sources. Synthesizing report...",
                "sources": sources,
            },
        )

        context = _build_context(sources)
        yield _sse("status", {"stage": "synthesizing", "message": "Writing the final report..."})

        stream = await llm.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert research analyst. Write a thorough, well-structured "
                        "Markdown report on the user's topic using ONLY the provided sources. "
                        "Use headings, bullet points, and inline numbered citations like [1], [2] "
                        "that map to the source list. End with a 'Sources' section listing each "
                        "numbered source as a Markdown link. Do not fabricate facts not supported "
                        "by the sources."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Topic: {topic}\n\nSources:\n{context}",
                },
            ],
            temperature=0.4,
            max_tokens=3000,
            stream=True,
            extra_body=NO_THINKING,
        )

        wrote_any = False
        async for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta.content
            if delta:
                wrote_any = True
                yield _sse("token", {"text": delta})

        if not wrote_any:
            yield _sse("error", {"message": "The model returned an empty report. Please try again."})
            return

        yield _sse("done", {"message": "Report complete."})

    except Exception as exc:
        yield _sse("error", {"message": f"Agent failed: {exc}"})
