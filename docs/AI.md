# AI

## Abstraction

`server/services/ai/types.ts` defines the `AIService` interface:

```ts
interface AIService {
  classifyMessage(input): ClassificationResult    // priority + category + explanation
  extractTask(input): TaskSuggestion | null        // structured task from free text
  extractCalendarEvent(input): EventSuggestion | null
  prioritize(items): PrioritizedItem[]
  summarize(text): string
  generateReply(context): string
  chat(question, context): string                  // VORA Assistant
}
```

No UI component or `server/api/*` route calls an LLM directly — everything goes through `getAIService()` (`server/services/ai/index.ts`), a factory that returns:

- **`HeuristicAIService`** (`heuristic.ts`) when `AI_API_KEY` is unset — the default. Deterministic keyword and date-pattern matching, zero network calls, zero cost, fully offline.
- A real LLM-backed implementation, once one is written and wired into the factory — **not implemented yet**. Swapping in a provider (Anthropic, OpenAI, etc.) means writing one class satisfying `AIService` and adding a branch to the factory; nothing else in the codebase changes, because every call site already goes through the interface.

## What the heuristic engine actually does today

- **Message classification** (`POST /api/ai/classify`) — looks for urgency keywords (Italian + English: "urgente", "asap", "entro oggi", etc.) and date-like substrings to assign `priority` (`urgent`/`high`/`medium`/`low`) and `category`, and always returns a `reason` string explaining the match (e.g. *"Classificato come alta priorità perché il messaggio contiene una scadenza entro 24 ore."*) — per §21 of the master prompt, AI must explain its decision, not just output a label.
- **Task extraction** (`POST /api/ai/extract-task`, wired into the Inbox) — pattern-matches phrases like "puoi mandarmi... entro venerdì" into a `{ title, deadline, priority }` suggestion. The user sees **Confirm / Edit / Reject** before anything is written to Firestore — no task is ever created automatically. This is the human-approval requirement from §50.
- **VORA Assistant** (sparkle icon in the topbar, available from any page — not a separate chatbot page, per §24) — answers a **fixed set of real questions** ("Organizza la mia giornata", "Quali sono le mie priorità?", "Riassumi le comunicazioni di oggi", "Quali messaggi non ho ancora risposto?") by querying live Firestore data through the same composables the rest of the UI uses, then formatting a real answer from real numbers — it is not free-form chat and cannot answer arbitrary questions, because there is no LLM behind it yet.

## What's not built

- **Calendar assistant** (§23 — "let's talk tomorrow afternoon" → inspect availability → suggest slots → confirm → create event) is not implemented. `extractCalendarEvent()` exists on the interface but has no wired UI entry point yet.
- **Free-form chat** — the Assistant only answers its fixed question set; there is no open text input that reaches an LLM, because there is no LLM configured. This is an honest limitation of running on the heuristic engine, not a missing feature of the abstraction itself.
- **Email/WhatsApp AI actions** (summarize, generate reply, prioritize inline) described in §53 exist on the `AIService` interface (`summarize`, `generateReply`) but are only wired into the Inbox's task-extraction flow, not yet surfaced as contextual buttons on every communication.

## Human approval

Every AI action with a real consequence requires explicit confirmation before touching the database — this is enforced in the Inbox's task-extraction UI (Confirm/Edit/Reject), and must be preserved in any future feature that lets AI take action (e.g. the calendar assistant above). See §50 of the master prompt: *"AI actions with meaningful consequences must require confirmation."*

## Knowledge vector search (RAG groundwork)

`server/services/embeddings/` mirrors the `AIService` pattern: an `EmbeddingService` interface (`embed(text): number[]`) with a `HeuristicEmbeddingService` default (`heuristic.ts`) — a hashing-trick bag-of-words vector (unigrams + adjacent bigrams hashed into 256 buckets, L2-normalized, with a small IT/EN stopword list), no model or API key involved. It is **not** semantic — it measures token/phrase overlap, not meaning or synonyms — but it's an honest, zero-dependency stand-in for real relevance ranking.

Every `createDocument`/`updateDocument` call in `server/utils/knowledge.ts` computes and stores an `embedding` field on the Firestore doc (title + content + tags). `searchDocuments(organizationId, query)` embeds the query the same way and ranks every doc in the org by cosine similarity (`server/api/knowledge/search.get.ts`, `GET /api/knowledge/search?q=...`), org-scoped like every other query. The Knowledge UI (`pages/knowledge/index.vue`) exposes this as an opt-in "smart search" (press Enter or the search icon) alongside the existing instant substring filter, showing a relevance % badge per result.

This is retrieval, not generation — `AIService.chat()` doesn't yet call it to ground answers in the user's documents. Wiring `searchDocuments` into the assistant (retrieve top-N docs, inject into the prompt/heuristic context) is the natural next step for real RAG, and swapping `HeuristicEmbeddingService` for a real embedding API (OpenAI, Vertex, Cohere, ...) requires no change to any caller — they only see `embed(text): number[]`.

## Configuring a real provider

1. Implement a class satisfying `AIService` in `server/services/ai/` (e.g. `anthropic.ts`), calling the real API for each method.
2. Add a branch to the factory in `server/services/ai/index.ts`: if `process.env.AI_API_KEY` is set, return the new class instead of `HeuristicAIService`.
3. Set `AI_API_KEY` in `.env` (see [ENVIRONMENT.md](./ENVIRONMENT.md)).

Never hardcode an API key in source, and never call the provider SDK from a `.vue` file or `mobile/app/*` screen — always through `AIService`.
