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
  <div class="flex h-screen overflow-hidden bg-paper-100 dark:bg-ink-950">
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
