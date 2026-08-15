<script setup lang="ts">
definePageMeta({ layout: 'public' })

const { t } = useI18n()
const route = useRoute()
const { fetch: refreshSession } = useUserSession()
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const status = ref<'pending' | 'success' | 'error'>('pending')

onMounted(async () => {
  if (!token.value) {
    status.value = 'error'
    return
  }
  try {
    await $fetch('/api/auth/verify-email', { method: 'POST', body: { token: token.value } })
    await refreshSession()
    status.value = 'success'
  } catch {
    status.value = 'error'
  }
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-6">
    <div class="w-full max-w-sm text-center">
      <div class="flex items-center gap-2 mb-8 justify-center">
        <UiBrandMark :size="32" />
        <span class="font-bold text-h4 tracking-tighter">Vora</span>
      </div>

      <div v-if="status === 'pending'" class="text-body-sm text-ink-400">{{ $t('auth.verifying') }}</div>

      <div v-else-if="status === 'success'" class="space-y-4">
        <div class="rounded-md border border-success/30 bg-success/5 p-4 text-body-sm">{{ $t('auth.verifySuccess') }}</div>
        <NuxtLink to="/dashboard" class="block w-full py-2.5 rounded-md bg-primary text-ink-950 font-medium">
          {{ $t('auth.goToDashboard') }}
        </NuxtLink>
      </div>

      <div v-else class="space-y-4">
        <div class="rounded-md border border-danger/30 bg-danger/5 p-4 text-body-sm">{{ $t('auth.verifyError') }}</div>
        <NuxtLink to="/login" class="text-primary-600 dark:text-primary font-medium text-body-sm">{{ $t('auth.backToLogin') }}</NuxtLink>
      </div>
    </div>
  </div>
</template>
