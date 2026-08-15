<script setup lang="ts">
import type { NotificationPreferences } from '~/shared/types/notification'

definePageMeta({ layout: 'default' })

const { user } = useUserSession()
const colorMode = useColorMode()
const { locale, locales, setLocale, t } = useI18n()

// --- Profile ---
const profileName = ref(user.value?.name ?? '')
const profileSaving = ref(false)
const profileSaved = ref(false)
async function onSaveProfile() {
  profileSaving.value = true
  profileSaved.value = false
  try {
    await $fetch('/api/auth/profile', { method: 'PUT', body: { name: profileName.value } })
    profileSaved.value = true
  } finally {
    profileSaving.value = false
  }
}

// --- Security: change password ---
const currentPassword = ref('')
const newPassword = ref('')
const passwordError = ref('')
const passwordSaving = ref(false)
const passwordSaved = ref(false)
async function onChangePassword() {
  passwordError.value = ''
  passwordSaved.value = false
  passwordSaving.value = true
  try {
    await $fetch('/api/auth/change-password', { method: 'POST', body: { currentPassword: currentPassword.value, newPassword: newPassword.value } })
    currentPassword.value = ''
    newPassword.value = ''
    passwordSaved.value = true
  } catch (e: any) {
    passwordError.value = e?.statusCode === 401 ? t('settings.security.wrongPassword') : t('settings.security.error')
  } finally {
    passwordSaving.value = false
  }
}

// --- Notifications ---
const { data: prefs, pending: prefsPending } = await useFetch<NotificationPreferences>('/api/notifications/preferences')
const prefsSaving = ref(false)
async function onTogglePref(key: keyof NotificationPreferences) {
  if (!prefs.value) return
  prefs.value[key] = !prefs.value[key]
  prefsSaving.value = true
  try {
    await $fetch('/api/notifications/preferences', { method: 'PUT', body: prefs.value })
  } finally {
    prefsSaving.value = false
  }
}
const NOTIFICATION_KEYS: (keyof NotificationPreferences)[] = [
  'messages', 'urgentTasks', 'appointments', 'reminders', 'aiActions', 'approvals', 'tickets', 'deadlines',
]

// --- Integrations status (read-only, honest) ---
interface IntegrationStatus {
  ai: { provider: string; live: boolean }
  email: { provider: string; live: boolean }
  whatsapp: { provider: string; live: boolean }
  oauthGoogle: { live: boolean }
}
const { data: status } = await useFetch<IntegrationStatus>('/api/settings/status')
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <div>
      <h1 class="text-h1 font-semibold tracking-tight">{{ $t('settings.title') }}</h1>
      <p class="text-body text-ink-400 mt-1">{{ $t('settings.subtitle') }}</p>
    </div>

    <!-- Profile -->
    <section class="rounded-lg border border-ink-100 dark:border-white/10 p-5 space-y-4">
      <h2 class="text-h4 font-medium">{{ $t('settings.profile.title') }}</h2>
      <div>
        <label for="settings-name" class="block text-label text-ink-400 mb-2">{{ $t('settings.profile.name') }}</label>
        <div class="flex gap-3">
          <input id="settings-name" v-model="profileName" type="text" class="vora-input" />
          <button type="button" :disabled="profileSaving" class="shrink-0 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50" @click="onSaveProfile">
            {{ profileSaving ? $t('settings.saving') : $t('settings.save') }}
          </button>
        </div>
        <p v-if="profileSaved" class="text-caption text-success mt-2">{{ $t('settings.saved') }}</p>
      </div>
      <div>
        <p class="text-label text-ink-400">{{ $t('settings.profile.email') }}</p>
        <p class="text-body">{{ user?.email }}</p>
      </div>
      <div>
        <p class="text-label text-ink-400">{{ $t('settings.profile.organization') }}</p>
        <p class="text-body">{{ user?.organizationName }} · {{ $t(`settings.profile.role.${user?.role}`) }}</p>
      </div>
    </section>

    <!-- Security -->
    <section class="rounded-lg border border-ink-100 dark:border-white/10 p-5 space-y-4">
      <h2 class="text-h4 font-medium">{{ $t('settings.security.title') }}</h2>
      <form class="space-y-3" @submit.prevent="onChangePassword">
        <div>
          <label for="settings-current-password" class="block text-label text-ink-400 mb-2">{{ $t('settings.security.currentPassword') }}</label>
          <input id="settings-current-password" v-model="currentPassword" type="password" class="vora-input" required />
        </div>
        <div>
          <label for="settings-new-password" class="block text-label text-ink-400 mb-2">{{ $t('settings.security.newPassword') }}</label>
          <input id="settings-new-password" v-model="newPassword" type="password" class="vora-input" required minlength="8" />
        </div>
        <p v-if="passwordError" class="text-body-sm text-danger">{{ passwordError }}</p>
        <p v-if="passwordSaved" class="text-caption text-success">{{ $t('settings.saved') }}</p>
        <button type="submit" :disabled="passwordSaving" class="px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover disabled:opacity-50">
          {{ passwordSaving ? $t('settings.saving') : $t('settings.security.changePassword') }}
        </button>
      </form>
    </section>

    <!-- Appearance -->
    <section class="rounded-lg border border-ink-100 dark:border-white/10 p-5 space-y-4">
      <h2 class="text-h4 font-medium">{{ $t('settings.appearance.title') }}</h2>
      <div class="flex gap-2">
        <button
          v-for="mode in ['light', 'dark', 'system']"
          :key="mode"
          type="button"
          class="px-4 py-2 rounded-md text-body-sm border transition-colors"
          :class="colorMode.preference === mode ? 'border-primary bg-primary/10 text-primary-600 dark:text-primary' : 'border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5'"
          @click="colorMode.preference = mode"
        >
          {{ $t(`settings.appearance.${mode}`) }}
        </button>
      </div>
    </section>

    <!-- Language -->
    <section class="rounded-lg border border-ink-100 dark:border-white/10 p-5 space-y-4">
      <h2 class="text-h4 font-medium">{{ $t('settings.language.title') }}</h2>
      <select :value="locale" class="vora-input max-w-xs" @change="setLocale(($event.target as HTMLSelectElement).value as typeof locale)">
        <option v-for="l in locales" :key="typeof l === 'string' ? l : l.code" :value="typeof l === 'string' ? l : l.code">
          {{ typeof l === 'string' ? l : l.name }}
        </option>
      </select>
    </section>

    <!-- Notifications -->
    <section class="rounded-lg border border-ink-100 dark:border-white/10 p-5 space-y-4">
      <h2 class="text-h4 font-medium">{{ $t('settings.notifications.title') }}</h2>
      <div v-if="prefsPending" class="h-24 rounded-md bg-ink-50 dark:bg-white/5 animate-pulse" />
      <div v-else-if="prefs" class="space-y-2">
        <label v-for="key in NOTIFICATION_KEYS" :key="key" class="flex items-center justify-between py-2 border-b border-ink-50 dark:border-white/5 last:border-0">
          <span class="text-body-sm">{{ $t(`settings.notifications.${key}`) }}</span>
          <input type="checkbox" class="size-4 rounded accent-primary" :checked="prefs[key]" @change="onTogglePref(key)" />
        </label>
      </div>
    </section>

    <!-- Integrations (read-only, honest status) -->
    <section class="rounded-lg border border-ink-100 dark:border-white/10 p-5 space-y-4">
      <h2 class="text-h4 font-medium">{{ $t('settings.integrations.title') }}</h2>
      <div v-if="status" class="space-y-2">
        <div v-for="item in [
          { key: 'ai', label: $t('settings.integrations.ai'), live: status.ai.live, provider: status.ai.provider },
          { key: 'email', label: $t('settings.integrations.email'), live: status.email.live, provider: status.email.provider },
          { key: 'whatsapp', label: $t('settings.integrations.whatsapp'), live: status.whatsapp.live, provider: status.whatsapp.provider },
          { key: 'oauthGoogle', label: $t('settings.integrations.oauthGoogle'), live: status.oauthGoogle.live, provider: null },
        ]" :key="item.key" class="flex items-center justify-between py-2 border-b border-ink-50 dark:border-white/5 last:border-0">
          <span class="text-body-sm">{{ item.label }}</span>
          <span class="text-caption px-2 py-0.5 rounded-full font-medium" :class="item.live ? 'bg-success/10 text-success' : 'bg-ink-100 dark:bg-white/10 text-ink-400'">
            {{ item.live ? $t('settings.integrations.live') : $t('settings.integrations.mock') }}
          </span>
        </div>
      </div>
      <p class="text-caption text-ink-400">{{ $t('settings.integrations.note') }}</p>
    </section>

    <!-- Applications -->
    <section class="rounded-lg border border-ink-100 dark:border-white/10 p-5 space-y-3">
      <h2 class="text-h4 font-medium">{{ $t('settings.applications.title') }}</h2>
      <p class="text-body-sm text-ink-400">{{ $t('settings.applications.subtitle') }}</p>
    </section>

    <!-- API (honestly not built) -->
    <section class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-5 space-y-2">
      <h2 class="text-h4 font-medium">{{ $t('settings.api.title') }}</h2>
      <p class="text-body-sm text-ink-400">{{ $t('settings.api.notice') }}</p>
    </section>
  </div>
</template>

<style scoped>
.vora-input {
  @apply w-full px-3 py-2 rounded-md border border-ink-100 dark:border-white/10 bg-white dark:bg-white/5 text-body outline-none focus:border-primary transition-colors;
}
</style>
