# AI

## Two separate systems

1. **`AIService`** (`server/services/ai/`) — single-shot, stateless helpers (classify, summarize, extract, reply) used inline in specific modules (Inbox, Contacts). Unchanged by the Assistant work below.
2. **The Assistant** (`server/services/assistant/`) — a real, persistent, tool-using conversational agent, reachable from the sparkle icon next to notifications (web Topbar; mobile Screen header). This is the "VORA Assistant" end users actually talk to. See "The Assistant" section below.

## `AIService` abstraction

`server/services/ai/types.ts` defines the `AIService` interface:

```ts
interface AIService {
  classifyMessage(text): ClassificationResult      // priority + category + explanation
  extractTaskSuggestion(text): TaskSuggestion | null
  extractCalendarEvent(text): CalendarEventSuggestion | null
  summarize(text): SummaryResult
  generateReply(text): ReplyDraft
  wellbeingChat(history, message): AsyncIterable<string> // free-form Wellbeing chat — streams
}
```

No UI component or `server/api/*` route calls an LLM directly — everything goes through `getAIService()` (`server/services/ai/index.ts`), a factory that returns:

- **`AnthropicAIService`** (`anthropic.ts`) when `AI_API_KEY` is set — real Claude API calls (`@anthropic-ai/sdk`, model `claude-opus-5`). The five structured methods use `output_config.format` with a Zod schema (`client.messages.parse()`), so the response is guaranteed to match the expected shape — no ad-hoc JSON parsing. `wellbeingChat()` is genuine free-form generation, streamed token-by-token via `client.messages.stream()`.
- **`HeuristicAIService`** (`heuristic.ts`) when `AI_API_KEY` is unset — the default. Deterministic keyword and date-pattern matching, zero network calls, zero cost, fully offline. Also the automatic fallback path for these five methods — every method has a heuristic implementation, so this half of the app is fully functional without any AI key.

All five methods are gated behind `requireOrgId` + `checkRateLimit` (20 requests / 10 min per IP) at their respective `server/api/ai/*.post.ts` routes.

- **Message classification** (`POST /api/ai/classify`) — assigns `priority`/`category` with an explanation.
- **Task extraction** (`POST /api/ai/extract-task`, wired into the Inbox) — extracts a `{ title, deadline, priority }` suggestion. The user sees **Confirm / Edit / Reject** before anything is written to Firestore — no task is ever created automatically.
- **Summarize / reply draft** (`POST /api/ai/summarize`, `/api/ai/reply`) — used in the Inbox and Contacts modules.

## The Assistant (`server/services/assistant/`)

A real, tool-using, streaming conversational agent — **not** the old fixed-question panel this replaced. Genuinely calls Claude with no fallback: if `AI_API_KEY` isn't set, the user sees a clear "not configured" message (never a fabricated response — see "Fallback" below).

### Files

- `agent.ts` — the turn loop: streams Claude's response token-by-token, executes read-only tools immediately, pauses and asks for confirmation before any write tool, persists the final message. `runAssistantTurn()` starts a fresh turn; `resumeAssistantTurn()` continues one after a tool confirmation.
- `tools.ts` — `ASSISTANT_TOOLS`: `search_vora`, `list_tasks`, `list_upcoming_events` (read-only, run immediately), `create_task`, `create_calendar_event` (writes, always paused for confirmation). Each tool's Zod input schema doubles as its Claude-facing JSON schema via Zod v4's native `z.toJSONSchema()`. Deliberately small — every tool wraps a function that already exists in `server/utils/` (tasks, events, search); nothing invented that Vora doesn't actually do.
- `prompt.ts` — the single, centralized system prompt (identity, real tool list, confirmation rules, the payroll/IRPEF hard limit, prompt-injection guidance). Never sent to or built by the client.
- `title.ts` — `deriveTitle()`: the first message becomes the conversation's title, truncated at a word boundary — no extra AI call just to name a chat.

### Data model

One Firestore collection, `aiConversations` — no separate messages collection or composite index needed (`server/utils/assistantConversations.ts` queries by `organizationId` + `userId` equality only, sorting/filtering in-memory, the same "fine at this scale" pattern already used by `search.get.ts`):

```ts
interface AssistantConversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  archivedAt: string | null
  messages: AssistantMessage[]  // embedded — no pagination needed at this scale
}
```

Conversations are **personal**, not org-shared — every read/write checks both `organizationId` and `userId`.

### API (`server/api/ai/assistant/`)

- `GET/POST /conversations`, `GET/PATCH/DELETE /conversations/:id` — plain CRUD, session-authenticated (`resolveSession`), rate-limited.
- `POST /conversations/:id/messages` — sends a user message, returns an SSE stream (`event: delta|tool_result|confirm_required|error|done`) reusing the exact transport already proven by `wellbeing/chat.post.ts` (`createEventStream`, `eventStream.onClosed()` for real abort-on-disconnect).
- `POST /conversations/:id/tool-confirm` — resumes a paused turn after the user approves/rejects a pending write tool; also SSE.

### Tool confirmation

A write tool (`create_task`, `create_calendar_event`) is never executed by the model directly. `agent.ts` intercepts the `tool_use` block, marks it `pending_confirmation`, and stops the turn — the UI shows a plain-language confirmation card ("Creare il task 'X'?" / Confirm / Cancel). Only a real user tap calls `/tool-confirm`, which re-validates the same Zod schema and *then* executes. Claude proposing an action and the action actually happening are always two separate, user-gated steps.

### Prompt injection

Tool *results* (search hits, task/event data) are passed back to Claude as `tool_result` content blocks — structured data, never re-injected as system/instruction text — so content that happens to look like an instruction inside a task title or search result can't hijack the conversation. The system prompt explicitly tells the model this too (`prompt.ts`).

### Web UI (`components/ai/AssistantPanel.vue` + `composables/useAssistant.ts`)

Replaces the old fixed-question panel entirely (and its dead `/api/ai/chat` endpoint / `AIService.chat()` method, both removed). List view (search, Recent/Archived tabs, rename/archive/restore/delete via a row menu) and chat view (streaming bubbles, markdown via the existing `useMarkdown()` — HTML-escaped before parsing, so no XSS risk — stop/regenerate/copy, tool-confirm card) toggle within one panel, reusing Vora's existing glass/gradient visual language, not a bespoke chat-widget look.

### Mobile parity (`app/assistant.tsx` + `hooks/useAssistant.ts`)

Same API, same data model, same conversation IDs — opening a chat on the phone and continuing it on the web (or vice versa) shows the same messages, because both just read/write the same `aiConversations` document. Streaming uses `expo/fetch` (not RN's classic `fetch`, which doesn't expose a readable stream body) — its `Response.body` is a real `ReadableStream<Uint8Array>`, so the SSE parsing logic mirrors the web composable almost line-for-line.

**Deliberately deferred** (see also "What's not built"): voice input/output (would need a new native module — `expo-speech`/`expo-av` or similar — evaluated as too much added native-project risk for this pass, given the hand-built unsigned Xcode setup); a dedicated markdown renderer on mobile (no pure-JS option was vetted in time — messages render as plain `Text` with `selectable` so native long-press-to-copy still works); copy-to-clipboard on mobile (same reasoning — `selectable` text already gives users a copy path without a new native dependency).

## What's not built

- **Voice input/output** for the Assistant (speech-to-text composer, text-to-speech playback) — see "Deliberately deferred" above.
- **Contextual "ask AI" on a specific record** (e.g. a ticket or contact detail screen passing that record as context) — the Assistant only has the tools in `tools.ts`; it doesn't yet receive "the record the user is currently looking at" automatically.
- **Full end-to-end/integration test automation** for the Assistant — covered instead by real unit tests (`tests/unit/server/assistant*.spec.ts`: tool registry, input schemas, system prompt, title derivation) plus a manual Playwright-driven browser pass during development (conversation create/send/archive/restore/search/delete, verified against a live Firestore emulator) — not committed as an automated e2e suite.
- **Email/WhatsApp AI actions as contextual buttons on every communication** — `summarize`/`generateReply` exist on `AIService` but are only wired into the Inbox's task-extraction flow.

## Human approval

Every AI action with a real consequence requires explicit confirmation before touching the database: the Inbox's task-extraction UI (Confirm/Edit/Reject) for `AIService`, and the Assistant's tool-confirmation card (see above) for the agent. Any future feature that lets AI take action must preserve this.

## Knowledge vector search (RAG groundwork)

`server/services/embeddings/` mirrors the `AIService` pattern: an `EmbeddingService` interface (`embed(text): number[]`) with a `HeuristicEmbeddingService` default (`heuristic.ts`) — a hashing-trick bag-of-words vector (unigrams + adjacent bigrams hashed into 256 buckets, L2-normalized, with a small IT/EN stopword list), no model or API key involved. It is **not** semantic — it measures token/phrase overlap, not meaning or synonyms — but it's an honest, zero-dependency stand-in for real relevance ranking.

Every `createDocument`/`updateDocument` call in `server/utils/knowledge.ts` computes and stores an `embedding` field on the Firestore doc (title + content + tags). `searchDocuments(organizationId, query)` embeds the query the same way and ranks every doc in the org by cosine similarity (`server/api/knowledge/search.get.ts`, `GET /api/knowledge/search?q=...`), org-scoped like every other query. The Knowledge UI (`pages/knowledge/index.vue`) exposes this as an opt-in "smart search" (press Enter or the search icon) alongside the existing instant substring filter, showing a relevance % badge per result.

This is retrieval, not generation — `AIService.chat()` doesn't yet call it to ground answers in the user's documents. Wiring `searchDocuments` into the assistant (retrieve top-N docs, inject into the prompt/heuristic context) is the natural next step for real RAG, and swapping `HeuristicEmbeddingService` for a real embedding API (OpenAI, Vertex, Cohere, ...) requires no change to any caller — they only see `embed(text): number[]`.

## Enabling the real provider

One env var powers both systems — `AIService`'s Anthropic branch and the Assistant both read `AI_API_KEY` (there's deliberately no second key to manage):

1. Get an API key at [console.anthropic.com](https://console.anthropic.com).
2. Set `AI_API_KEY` in `.env` (local dev) or the Netlify site's environment variables (production — see [DEPLOYMENT.md](./DEPLOYMENT.md)).
3. Optionally set `AI_MODEL` to override the default (`claude-opus-5`) used by the Assistant (`server/services/assistant/agent.ts`).

That's it — no code change needed. `GET /api/settings/status` reports `{ ai: { provider: 'anthropic', live: true } }` once configured (`provider: 'heuristic', live: false` otherwise) for the `AIService` half; the Assistant has no heuristic fallback of its own — without `AI_API_KEY` it shows a clear "not configured" message rather than a fake response (see "Fallback" in "The Assistant" above).

Swapping in a *different* provider (OpenAI, etc.) instead of Anthropic follows the same pattern for `AIService`: implement a class satisfying the interface in `server/services/ai/`, add a branch to the factory in `index.ts`, gate it on its own env var. Never hardcode an API key in source, and never call a provider SDK from a `.vue` file or `mobile/app/*` screen — always through `AIService` (or, for the Assistant, `server/services/assistant/agent.ts`).
