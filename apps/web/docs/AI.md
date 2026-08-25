# AI

## Abstraction

`server/services/ai/types.ts` defines the `AIService` interface:

```ts
interface AIService {
  classifyMessage(text): ClassificationResult      // priority + category + explanation
  extractTaskSuggestion(text): TaskSuggestion | null
  extractCalendarEvent(text): CalendarEventSuggestion | null
  summarize(text): SummaryResult
  generateReply(text): ReplyDraft
  chat(prompt, context): Promise<string>            // VORA Assistant — fixed question set over structured work data
  wellbeingChat(history, message): AsyncIterable<string> // free-form Wellbeing chat — streams
}
```

No UI component or `server/api/*` route calls an LLM directly — everything goes through `getAIService()` (`server/services/ai/index.ts`), a factory that returns:

- **`AnthropicAIService`** (`anthropic.ts`) when `AI_API_KEY` is set — real Claude API calls (`@anthropic-ai/sdk`, model `claude-opus-5`). The five structured methods (`classifyMessage`, `extractTaskSuggestion`, `extractCalendarEvent`, `summarize`, `generateReply`) use `output_config.format` with a Zod schema (`client.messages.parse()`), so the response is guaranteed to match the expected shape — no ad-hoc JSON parsing. `chat()` and `wellbeingChat()` are genuine free-form generation; `wellbeingChat()` streams token-by-token via `client.messages.stream()`.
- **`HeuristicAIService`** (`heuristic.ts`) when `AI_API_KEY` is unset — the default. Deterministic keyword and date-pattern matching, zero network calls, zero cost, fully offline. Also the automatic fallback path — every method has a heuristic implementation, so the app is fully functional without any AI key.

Swapping providers requires no other code change — every call site already goes through the interface.

## What the AI features actually do today

- **Message classification** (`POST /api/ai/classify`) — with `AI_API_KEY` set, a real Claude call assigns `priority`/`category` with an explanation; without it, `HeuristicAIService` looks for urgency keywords (Italian + English: "urgente", "asap", "entro oggi", etc.) and date-like substrings instead. Either way the response always includes a `reason`/`explanation` string — per §21 of the master prompt, AI must explain its decision, not just output a label.
- **Task extraction** (`POST /api/ai/extract-task`, wired into the Inbox) — extracts a `{ title, deadline, priority }` suggestion (real Claude call, or heuristic phrase-matching like "puoi mandarmi... entro venerdì" as the fallback). The user sees **Confirm / Edit / Reject** before anything is written to Firestore — no task is ever created automatically, regardless of which `AIService` produced the suggestion. This is the human-approval requirement from §50.
- **VORA Assistant** (sparkle icon in the topbar, available from any page — not a separate chatbot page, per §24) — answers a **fixed set of real questions** ("Organizza la mia giornata", "Quali sono le mie priorità?", "Riassumi le comunicazioni di oggi", "Quali messaggi non ho ancora risposto?") by querying live Firestore data through the same composables the rest of the UI uses, then formatting a real answer from real numbers. This stays a fixed-question interface by design (not the free-form surface — see Wellbeing chat below) even with a real LLM configured, since `chat()`'s job is grounding answers in the user's actual work data, not open conversation.
- **Wellbeing chat** (`/wellbeing/chat`, linked from the Wellbeing check-in page) — the one genuinely free-form chat surface in the app. Real streaming conversation via `AnthropicAIService.wellbeingChat()` when `AI_API_KEY` is set; a small set of scripted empathetic responses (with a crisis-line referral for concerning language) from `HeuristicAIService` otherwise. Conversation history persists per-user in Firestore (`wellbeingChatMessages`, `server/utils/wellbeingChat.ts`) — same personal-not-shared scoping as check-ins (organizationId + userId, not org-wide).

## What's not built

- **Calendar assistant** (§23 — "let's talk tomorrow afternoon" → inspect availability → suggest slots → confirm → create event) is not implemented. `extractCalendarEvent()` exists on the interface (and works, with either provider) but has no wired UI entry point yet.
- **Email/WhatsApp AI actions** (summarize, generate reply, prioritize inline) described in §53 exist on the `AIService` interface (`summarize`, `generateReply`) but are only wired into the Inbox's task-extraction flow, not yet surfaced as contextual buttons on every communication.

## Human approval

Every AI action with a real consequence requires explicit confirmation before touching the database — this is enforced in the Inbox's task-extraction UI (Confirm/Edit/Reject), and must be preserved in any future feature that lets AI take action (e.g. the calendar assistant above). See §50 of the master prompt: *"AI actions with meaningful consequences must require confirmation."*

## Knowledge vector search (RAG groundwork)

`server/services/embeddings/` mirrors the `AIService` pattern: an `EmbeddingService` interface (`embed(text): number[]`) with a `HeuristicEmbeddingService` default (`heuristic.ts`) — a hashing-trick bag-of-words vector (unigrams + adjacent bigrams hashed into 256 buckets, L2-normalized, with a small IT/EN stopword list), no model or API key involved. It is **not** semantic — it measures token/phrase overlap, not meaning or synonyms — but it's an honest, zero-dependency stand-in for real relevance ranking.

Every `createDocument`/`updateDocument` call in `server/utils/knowledge.ts` computes and stores an `embedding` field on the Firestore doc (title + content + tags). `searchDocuments(organizationId, query)` embeds the query the same way and ranks every doc in the org by cosine similarity (`server/api/knowledge/search.get.ts`, `GET /api/knowledge/search?q=...`), org-scoped like every other query. The Knowledge UI (`pages/knowledge/index.vue`) exposes this as an opt-in "smart search" (press Enter or the search icon) alongside the existing instant substring filter, showing a relevance % badge per result.

This is retrieval, not generation — `AIService.chat()` doesn't yet call it to ground answers in the user's documents. Wiring `searchDocuments` into the assistant (retrieve top-N docs, inject into the prompt/heuristic context) is the natural next step for real RAG, and swapping `HeuristicEmbeddingService` for a real embedding API (OpenAI, Vertex, Cohere, ...) requires no change to any caller — they only see `embed(text): number[]`.

## Enabling the real provider

`AnthropicAIService` (`server/services/ai/anthropic.ts`) is already implemented and wired into the factory. To use it instead of the heuristic engine:

1. Get an API key at [console.anthropic.com](https://console.anthropic.com).
2. Set `AI_API_KEY` in `.env` (local dev) or the Netlify site's environment variables (production — see [DEPLOYMENT.md](./DEPLOYMENT.md)).

That's it — no code change needed. `GET /api/settings/status` reports `{ ai: { provider: 'anthropic', live: true } }` once configured (`provider: 'heuristic', live: false` otherwise).

Swapping in a *different* provider (OpenAI, etc.) instead of Anthropic follows the same pattern: implement a class satisfying `AIService` in `server/services/ai/`, add a branch to the factory in `index.ts`, gate it on its own env var. Never hardcode an API key in source, and never call a provider SDK from a `.vue` file or `mobile/app/*` screen — always through `AIService`.
