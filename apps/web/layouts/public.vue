<template>
  <div class="relative min-h-screen bg-paper-50 dark:bg-ink-950">
    <!-- Same ambient backdrop as the authenticated app shell (layouts/default.vue)
         so the glass/backdrop-blur cards used across the landing sections have
         something to actually blur — without this the blur is invisible against
         a flat background. `fixed` (not absolute) so it stays put while the
         long marketing page scrolls. -->
    <div class="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div
        class="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full opacity-[0.07] dark:opacity-[0.12] blur-3xl"
        style="background: radial-gradient(circle, #39FF14 0%, transparent 70%)"
      />
      <div
        class="absolute -bottom-1/3 -right-1/4 w-[55vw] h-[55vw] rounded-full opacity-[0.05] dark:opacity-[0.1] blur-3xl"
        style="background: radial-gradient(circle, #39FF14 0%, transparent 70%)"
      />
    </div>
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>
