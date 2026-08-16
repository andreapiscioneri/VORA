<script setup lang="ts">
definePageMeta({ layout: 'public' })

const { t } = useI18n()
const { fetch: refreshSession } = useUserSession()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(route.query.error === 'oauth_failed' ? t('auth.oauthFailed') : null)

async function submit() {
  loading.value = true
  error.value = null
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await refreshSession()
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    router.push(redirect)
  } catch (e) {
    const err = e as { statusCode?: number }
    error.value = err.statusCode === 401 ? t('auth.invalidCredentials') : t('auth.invalidCredentials')
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

      <h1 class="text-h3 font-semibold text-center mb-6">{{ $t('auth.loginTitle') }}</h1>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label for="login-email" class="text-body-sm text-ink-600 dark:text-paper-300 mb-1 block">{{ $t('auth.email') }}</label>
          <input
            id="login-email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-paper-0 dark:bg-ink-900"
          />
        </div>
        <div>
          <label for="login-password" class="text-body-sm text-ink-600 dark:text-paper-300 mb-1 block">{{ $t('auth.password') }}</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-paper-0 dark:bg-ink-900"
          />
        </div>

        <p v-if="error" class="text-body-sm text-danger">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 rounded-md bg-primary text-ink-950 font-medium disabled:opacity-50"
        >
          {{ $t('auth.submitLogin') }}
        </button>
      </form>

      <div class="flex items-center gap-3 my-5">
        <div class="flex-1 h-px bg-ink-100 dark:bg-white/10" />
        <span class="text-caption text-ink-400">{{ $t('auth.or') }}</span>
        <div class="flex-1 h-px bg-ink-100 dark:bg-white/10" />
      </div>

      <a
        href="/api/auth/google"
        class="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-ink-100 dark:border-white/10 text-body-sm font-medium hover:bg-ink-50 dark:hover:bg-white/5"
      >
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.09A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"/></svg>
        {{ $t('auth.continueWithGoogle') }}
      </a>

      <p class="text-body-sm text-center mt-4">
        <NuxtLink to="/forgot-password" class="text-primary-600 dark:text-primary font-medium">{{ $t('auth.forgotLink') }}</NuxtLink>
      </p>

      <p class="text-body-sm text-ink-400 text-center mt-2">
        {{ $t('auth.noAccount') }}
        <NuxtLink to="/register" class="text-primary-600 dark:text-primary font-medium">{{ $t('auth.switchToRegister') }}</NuxtLink>
      </p>
    </div>
  </div>
</template>
