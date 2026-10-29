### 💡 Inspiration
In the modern enterprise, information is abundant, but *synthesis* is the bottleneck. Standard AI chatbots give short, surface-level answers that lack deep citations, while human analysts spend 6+ hours opening dozens of browser tabs just to write a preliminary market report. 

We were inspired to build **DeepDive**, an autonomous "Principal Analyst" agent. We wanted to see if we could orchestrate the raw reasoning power of **NVIDIA's Nemotron** models on the lightning-fast **Nebius AI Cloud** to fully automate the deep-dive research process—delivering enterprise-grade, fully cited reports in under 60 seconds.

### ⚙️ What it does
DeepDive is a multi-stage autonomous research agent wrapped in a premium, glassmorphism SaaS dashboard. 
When a user inputs a complex research topic (e.g., *"State of GPU Cloud Infrastructure in 2026"*), the agent executes a 3-step pipeline:
1. **Query Planning:** Uses Nemotron to deconstruct the prompt into distinct, highly optimized search queries.
2. **Web Grounding:** Calls the **Tavily Search API** to fetch raw, ad-free text from the most recent and relevant web sources.
3. **Deep Synthesis:** Streams a comprehensive Markdown report—complete with executive summaries, metrics, and inline citations (e.g., `[1]`, `[2]`)—directly to the user.

### 🛠️ How we built it
We split the architecture into a decoupled frontend and backend for maximum performance and zero bloat:
* **Frontend:** Built with **Next.js (App Router)**, TypeScript, and **Tailwind CSS**. We designed a premium "Dark Mode First" frosted-glass (glassmorphism) aesthetic. We utilized **Framer Motion** for buttery-smooth animations, including glowing orbs and staggered rendering of the report. 
* **Backend:** A **FastAPI** (Python) server orchestrating the agent logic. It leverages **Server-Sent Events (SSE)** to stream the AI's "thought process" and token generation live to the client.
* **AI & Compute:** We utilized the **Nebius Token Factory** (OpenAI-compatible API) to access NVIDIA's state-of-the-art open-source models (specifically `Llama-3.1-Nemotron-70B-Instruct-HF` / `Nemotron 3.5 Super`). We used low-temperature ($T = 0.1$) prompting for strict JSON query planning, and higher temperature ($T = 0.3$) for fluid report synthesis.

### 🚧 Challenges we ran into
* **Infinite Loading & Streaming Bugs:** Implementing live token streaming between a Next.js client and a FastAPI backend led to CORS blocks and hanging UI states. We had to heavily engineer the `StreamingResponse` in FastAPI to handle `try/except` blocks gracefully and yield explicit `[DONE]` tokens so the UI knew exactly when to transition states.
* **JSON Formatting from LLMs:** Ensuring the model strictly returned parseable JSON arrays for the search queries required aggressive system prompting and implementing a regex-based cleaning function on the backend.
* **UI/UX Refinement:** Our initial prototype looked rigid and "boxy." We completely overhauled the DOM to implement a modern, translucent workspace. Engineering the CSS radial gradients and `backdrop-blur-xl` properties without dropping frame rates during the Framer Motion animations took significant effort.

### 🏆 Accomplishments that we're proud of
* **Zero Hallucinations:** By mathematically restricting the context window to Tavily's output, every claim is tied to a real-world URL. (e.g., minimizing the hallucination probability $P(H) \approx 0$ by maximizing source grounding $G$).
* **The "Premium" Feel:** We successfully built a dashboard that doesn't just look like a hackathon project, but feels like a MAANG-ready, scalable enterprise product.
* **Nebius Integration:** Flawlessly porting our OpenAI-standard code over to Nebius Token Factory in minutes, taking advantage of their incredible inference speeds.

### 📚 What we learned
* **Advanced Prompt Engineering:** How to chain prompts across different model calls (Planner $\rightarrow$ Synthesizer) rather than relying on a single mega-prompt.
* **Streaming Architecture:** Mastering the `EventSource` API in the browser to consume real-time text streams from a Python backend.
* **The Value of Aesthetic:** We learned that user trust in an AI agent skyrockets when the UI is highly polished, animated, and responsive.

### 🚀 What's next for DeepDive
* **Multi-Modal Export:** Implementing a custom PDF engine (using `WeasyPrint`) to generate downloadable, branded pitch decks and executive summaries. 
* **Memory Graph:** Adding persistent memory using a vector database (like Qdrant) so the agent remembers a user's previous research and builds compounding knowledge over time.
* **Open-Source Release:** Cleaning up the repository to share our multi-agent FastAPI template with the broader NVIDIA and Nebius developer community!