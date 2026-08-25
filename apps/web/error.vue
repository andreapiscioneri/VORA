<script setup lang="ts">
import type { NuxtError } from '#app'

// Nuxt's global error boundary — replaces the entire app tree whenever an
// unhandled error reaches the top (a thrown createError(), an uncaught
// exception during render/setup, a failed page-level data fetch). This is
// the "Error Boundary globale" the app was missing: without this file,
// Nuxt falls back to its bare unstyled dev/prod error overlay instead of
// an on-brand page. See https://nuxt.com/docs/getting-started/error-handling
const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error.statusCode === 404)

function goHome() {
  clearError({ redirect: '/dashboard' })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-paper-50 dark:bg-ink-950 px-6">
    <div class="max-w-md w-full text-center space-y-6">
      <div class="flex items-center justify-center gap-2">
        <UiBrandMark :size="32" />
      </div>

      <UiIcon name="alert-triangle" :size="40" class="mx-auto text-danger" />

      <div>
        <p class="text-h1 font-semibold tracking-tight">{{ error.statusCode }}</p>
        <p class="text-h4 font-medium mt-2">
          {{ isNotFound ? $t('errorPage.notFoundTitle') : $t('errorPage.title') }}
        </p>
        <p class="text-body text-ink-400 mt-2">
          {{ isNotFound ? $t('errorPage.notFoundMessage') : $t('errorPage.message') }}
        </p>
      </div>

      <button
        class="px-5 py-2.5 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="goHome"
      >
        {{ $t('errorPage.action') }}
      </button>
    </div>
  </div>
</template>
