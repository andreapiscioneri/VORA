<script setup lang="ts">
definePageMeta({ layout: 'public' })

const { t } = useI18n()
const email = ref('')
const loading = ref(false)
const sent = ref(false)

async function submit() {
  loading.value = true
  try {
    await $fetch('/api/auth/forgot-password', { method: 'POST', body: { email: email.value } })
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-6">
    <div class="w-full max-w-sm">
      <div class="flex items-center gap-2 mb-8 justify-center">
        <UiBrandMark :size="32" />
        <span class="font-bold text-h4 tracking-tighter">Vora</span>
      </div>

      <h1 class="text-h3 font-semibold text-center mb-2">{{ $t('auth.forgotTitle') }}</h1>
      <p class="text-body-sm text-ink-400 text-center mb-6">{{ $t('auth.forgotSubtitle') }}</p>

      <div v-if="sent" class="rounded-md border border-success/30 bg-success/5 p-4 text-body-sm text-center">
        {{ $t('auth.forgotSent') }}
      </div>

      <form v-else class="space-y-4" @submit.prevent="submit">
        <div>
          <label for="forgot-email" class="text-body-sm text-ink-600 dark:text-paper-300 mb-1 block">{{ $t('auth.email') }}</label>
          <input
            id="forgot-email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-paper-0 dark:bg-ink-900"
          />
        </div>

        <button type="submit" :disabled="loading" class="w-full py-2.5 rounded-md bg-primary text-ink-950 font-medium disabled:opacity-50">
          {{ loading ? $t('auth.sending') : $t('auth.forgotSubmit') }}
        </button>
      </form>

      <p class="text-body-sm text-ink-400 text-center mt-6">
        <NuxtLink to="/login" class="text-primary-600 dark:text-primary font-medium">{{ $t('auth.backToLogin') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
