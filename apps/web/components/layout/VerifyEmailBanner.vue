<script setup lang="ts">
const { user } = useUserSession()
const sending = ref(false)
const sent = ref(false)

async function resend() {
  sending.value = true
  try {
    await $fetch('/api/auth/resend-verification', { method: 'POST' })
    sent.value = true
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div
    v-if="user && !user.emailVerified"
    class="shrink-0 px-4 tablet:px-6 py-2 bg-warning/10 border-b border-warning/20 flex items-center gap-3 text-body-sm"
  >
    <UiIcon name="alert-triangle" :size="16" class="text-warning shrink-0" />
    <span class="flex-1">{{ $t('auth.verifyBanner') }}</span>
    <span v-if="sent" class="text-success text-caption">{{ $t('auth.verifyBannerSent') }}</span>
    <button v-else class="text-primary-600 dark:text-primary font-medium shrink-0 disabled:opacity-50" :disabled="sending" @click="resend">
      {{ sending ? $t('auth.sending') : $t('auth.verifyBannerResend') }}
    </button>
  </div>
</template>
