<script setup lang="ts">
const assistantOpen = useState('assistant-open', () => false)
const launcherOpen = useState('launcher-open', () => false)

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    launcherOpen.value = !launcherOpen.value
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="relative flex h-screen overflow-hidden bg-paper-100 dark:bg-ink-950">
    <!-- Ambient backdrop the glass surfaces blur against — fixed, decorative,
         identical shape in both themes so it reads as one continuous app
         chrome rather than a per-page background. -->
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

    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-ink-950 focus:text-body-sm focus:font-medium"
    >
      {{ $t('common.skipToContent') }}
    </a>
    <LayoutSidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <LayoutTopbar />
      <LayoutVerifyEmailBanner />
      <main id="main-content" tabindex="-1" class="flex-1 overflow-y-auto p-4 tablet:p-6 outline-none">
        <slot />
      </main>
    </div>
    <LauncherAppLauncher />
    <AiAssistantPanel v-if="assistantOpen" @close="assistantOpen = false" />
  </div>
</template>
