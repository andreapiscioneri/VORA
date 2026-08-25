<script setup lang="ts">
definePageMeta({ layout: 'public' })

const { t } = useI18n()
const route = useRoute()
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const done = ref(false)

async function submit() {
  loading.value = true
  error.value = null
  try {
    await $fetch('/api/auth/reset-password', { method: 'POST', body: { token: token.value, password: password.value } })
    done.value = true
  } catch (e) {
    const err = e as { statusCode?: number; data?: { data?: { fieldErrors?: Record<string, string[]> } } }
    if (err.statusCode === 400) {
      error.value = t('auth.resetInvalidLink')
    } else {
      const passwordError = err.data?.data?.fieldErrors?.password?.[0]
      error.value = passwordError ? t(passwordError) : t('auth.passwordTooShort')
    }
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

      <h1 class="text-h3 font-semibold text-center mb-6">{{ $t('auth.resetTitle') }}</h1>

      <div v-if="!token" class="rounded-md border border-danger/30 bg-danger/5 p-4 text-body-sm text-center">
        {{ $t('auth.resetInvalidLink') }}
      </div>

      <div v-else-if="done" class="space-y-4">
        <div class="rounded-md border border-success/30 bg-success/5 p-4 text-body-sm text-center">
          {{ $t('auth.resetSuccess') }}
        </div>
        <NuxtLink to="/login" class="block w-full py-2.5 rounded-md bg-primary text-ink-950 font-medium text-center">
          {{ $t('auth.backToLogin') }}
        </NuxtLink>
      </div>

      <form v-else class="space-y-4" @submit.prevent="submit">
        <div>
          <label for="reset-password" class="text-body-sm text-ink-600 dark:text-paper-300 mb-1 block">{{ $t('auth.newPassword') }}</label>
          <input
            id="reset-password"
            v-model="password"
            type="password"
            required
            autocomplete="new-password"
            class="w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-paper-0 dark:bg-ink-900"
          >
          <UiPasswordStrengthMeter :password="password" />
        </div>

        <p v-if="error" class="text-body-sm text-danger">{{ error }}</p>

        <button type="submit" :disabled="loading" class="w-full py-2.5 rounded-md bg-primary text-ink-950 font-medium disabled:opacity-50">
          {{ loading ? $t('auth.sending') : $t('auth.resetSubmit') }}
        </button>
      </form>
    </div>
  </div>
</template>
