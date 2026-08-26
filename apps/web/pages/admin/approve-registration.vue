<script setup lang="ts">
definePageMeta({ layout: 'public' })

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

type Pending = { name: string; email: string; createdAt: string }
type State = 'loading' | 'ready' | 'not-authorized' | 'invalid' | 'approved' | 'rejected' | 'error'

const REDIRECT_DELAY_MS = 3000

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const state = ref<State>('loading')
const pending = ref<Pending | null>(null)
const actionLoading = ref(false)
let redirectTimer: ReturnType<typeof setTimeout> | null = null

onBeforeUnmount(() => {
  if (redirectTimer) clearTimeout(redirectTimer)
})

async function load() {
  if (!token.value) {
    state.value = 'invalid'
    return
  }
  try {
    pending.value = await $fetch<Pending>(`/api/admin/registrations/${token.value}`)
    state.value = 'ready'
  } catch (e) {
    const err = e as { statusCode?: number }
    state.value = err.statusCode === 403 ? 'not-authorized' : 'invalid'
  }
}

async function act(action: 'approve' | 'reject') {
  actionLoading.value = true
  try {
    await $fetch(`/api/admin/registrations/${action}`, { method: 'POST', body: { token: token.value } })
    state.value = action === 'approve' ? 'approved' : 'rejected'
    redirectTimer = setTimeout(() => router.push('/dashboard'), REDIRECT_DELAY_MS)
  } catch {
    state.value = 'error'
  } finally {
    actionLoading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-6">
    <div class="w-full max-w-sm text-center">
      <div class="flex items-center gap-2 mb-8 justify-center">
        <UiBrandMark :size="32" />
        <span class="font-bold text-h4 tracking-tighter">Vora</span>
      </div>

      <template v-if="state === 'loading'">
        <p class="text-body text-ink-500 dark:text-paper-300">{{ t('admin.registrations.loading') }}</p>
      </template>

      <template v-else-if="state === 'not-authorized'">
        <p class="text-body text-danger">{{ t('admin.registrations.notAuthorized') }}</p>
      </template>

      <template v-else-if="state === 'invalid'">
        <p class="text-body text-danger">{{ t('admin.registrations.invalid') }}</p>
      </template>

      <template v-else-if="state === 'ready' && pending">
        <h1 class="text-h3 font-semibold mb-2">{{ t('admin.registrations.title') }}</h1>
        <div class="text-left rounded-lg border border-ink-100 dark:border-white/10 p-4 my-6 space-y-1">
          <p class="text-body-sm"><span class="text-ink-400">{{ t('admin.registrations.name') }}:</span> {{ pending.name }}</p>
          <p class="text-body-sm"><span class="text-ink-400">{{ t('admin.registrations.email') }}:</span> {{ pending.email }}</p>
        </div>
        <div class="flex gap-3">
          <button
            type="button"
            :disabled="actionLoading"
            class="flex-1 py-2.5 rounded-md bg-primary text-ink-950 font-medium disabled:opacity-50"
            @click="act('approve')"
          >
            {{ t('admin.registrations.approve') }}
          </button>
          <button
            type="button"
            :disabled="actionLoading"
            class="flex-1 py-2.5 rounded-md border border-ink-100 dark:border-white/10 font-medium disabled:opacity-50"
            @click="act('reject')"
          >
            {{ t('admin.registrations.reject') }}
          </button>
        </div>
      </template>

      <template v-else-if="state === 'approved'">
        <p class="text-body text-success">{{ t('admin.registrations.approvedMessage') }}</p>
        <p class="text-body-sm text-ink-400 mt-2">{{ t('admin.registrations.redirecting') }}</p>
      </template>

      <template v-else-if="state === 'rejected'">
        <p class="text-body text-ink-500 dark:text-paper-300">{{ t('admin.registrations.rejectedMessage') }}</p>
        <p class="text-body-sm text-ink-400 mt-2">{{ t('admin.registrations.redirecting') }}</p>
      </template>

      <template v-else-if="state === 'error'">
        <p class="text-body text-danger">{{ t('admin.registrations.error') }}</p>
      </template>
    </div>
  </div>
</template>
