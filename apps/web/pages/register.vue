<script setup lang="ts">
definePageMeta({ layout: 'public' })

const { t } = useI18n()

const name = ref('')
const email = ref('')
const password = ref('')
const organizationName = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const pending = ref(false)

async function submit() {
  loading.value = true
  error.value = null
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { name: name.value, email: email.value, password: password.value, organizationName: organizationName.value },
    })
    pending.value = true
  } catch (e) {
    const err = e as { statusCode?: number; data?: { data?: { fieldErrors?: Record<string, string[]> } } }
    if (err.statusCode === 409) {
      error.value = t('auth.emailTaken')
    } else if (err.statusCode === 422) {
      const passwordError = err.data?.data?.fieldErrors?.password?.[0]
      error.value = passwordError ? t(passwordError) : t('auth.passwordTooShort')
    } else {
      error.value = t('auth.passwordTooShort')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-6 py-12">
    <div class="w-full max-w-sm">
      <div class="flex items-center gap-2 mb-8 justify-center">
        <UiBrandMark :size="32" />
        <span class="font-bold text-h4 tracking-tighter">Vora</span>
      </div>

      <template v-if="pending">
        <h1 class="text-h3 font-semibold text-center mb-3">{{ $t('auth.pendingApprovalTitle') }}</h1>
        <p class="text-body-sm text-ink-500 dark:text-paper-300 text-center">{{ $t('auth.pendingApprovalMessage') }}</p>
        <NuxtLink to="/login" class="block text-center mt-6 text-primary-600 dark:text-primary font-medium">{{ $t('auth.switchToLogin') }}</NuxtLink>
      </template>

      <template v-else>
        <h1 class="text-h3 font-semibold text-center mb-6">{{ $t('auth.registerTitle') }}</h1>

        <form class="space-y-4" @submit.prevent="submit">
          <div>
            <label for="register-name" class="text-body-sm text-ink-600 dark:text-paper-300 mb-1 block">{{ $t('auth.name') }}</label>
            <input
              id="register-name"
              v-model="name"
              type="text"
              required
              autocomplete="name"
              class="w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-paper-0 dark:bg-ink-900"
            >
          </div>
          <div>
            <label for="register-org" class="text-body-sm text-ink-600 dark:text-paper-300 mb-1 block">{{ $t('auth.organizationName') }}</label>
            <input
              id="register-org"
              v-model="organizationName"
              type="text"
              required
              class="w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-paper-0 dark:bg-ink-900"
            >
          </div>
          <div>
            <label for="register-email" class="text-body-sm text-ink-600 dark:text-paper-300 mb-1 block">{{ $t('auth.email') }}</label>
            <input
              id="register-email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              class="w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-paper-0 dark:bg-ink-900"
            >
          </div>
          <div>
            <label for="register-password" class="text-body-sm text-ink-600 dark:text-paper-300 mb-1 block">{{ $t('auth.password') }}</label>
            <input
              id="register-password"
              v-model="password"
              type="password"
              required
              minlength="8"
              autocomplete="new-password"
              class="w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-paper-0 dark:bg-ink-900"
            >
            <UiPasswordStrengthMeter :password="password" />
          </div>

          <p v-if="error" class="text-body-sm text-danger">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2.5 rounded-md bg-primary text-ink-950 font-medium disabled:opacity-50"
          >
            {{ $t('auth.submitRegister') }}
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

        <p class="text-body-sm text-ink-400 text-center mt-6">
          {{ $t('auth.hasAccount') }}
          <NuxtLink to="/login" class="text-primary-600 dark:text-primary font-medium">{{ $t('auth.switchToLogin') }}</NuxtLink>
        </p>
      </template>
    </div>
  </div>
</template>
