// Every composable in composables/ fetches data through this instance
// instead of the bare global `$fetch`. The reason: on the very first
// request to any page (a hard refresh, a deep link, a bookmark — anything
// that isn't client-side SPA navigation), Nuxt renders that page's
// `<script setup>` on the SERVER, and any `await $fetch(...)` in it runs as
// an internal, in-process call that does NOT automatically carry the
// browser's session cookie. Every route is protected by session auth (see
// server/middleware/auth.ts), so that internal call came back 401 —
// composables with a try/catch silently showed "impossibile caricare X"
// until client-side hydration re-fetched with the real cookie and quietly
// fixed it; composables without one (e.g. useLeaveRequests' fetchAllRequests)
// crashed the whole SSR render. This instance forwards the incoming
// request's cookie header on the server (a no-op on the client, where the
// browser already attaches it), closing the gap at the root instead of
// patching each composable's symptom individually.
export default defineNuxtPlugin(() => {
  const apiFetch = $fetch.create({
    onRequest({ options }) {
      if (import.meta.server) {
        options.headers = { ...options.headers, ...useRequestHeaders(['cookie']) }
      }
    },
  })

  return { provide: { apiFetch } }
})
