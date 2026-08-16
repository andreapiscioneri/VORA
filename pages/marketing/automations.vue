<script setup lang="ts">
import type { Automation } from '~/shared/types/automation'

definePageMeta({ layout: 'default' })

const { automations, pending, error, fetchAutomations } = useAutomations()
await fetchAutomations()

const { locale } = useI18n()
const showForm = ref(false)
const editingAutomation = ref<Automation | null>(null)

function openNew() {
  editingAutomation.value = null
  showForm.value = true
}

function openEdit(automation: Automation) {
  editingAutomation.value = automation
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingAutomation.value = null
}

function formatLastRun(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleString(locale.value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('automations.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('automations.subtitle', { count: automations.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('automations.new') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="automations.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('automations.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('automations.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('automations.empty.cta') }}
      </button>
    </div>

    <div v-else class="space-y-2">
      <button
        v-for="a in automations"
        :key="a.id"
        class="w-full text-left flex items-center gap-4 rounded-lg border border-ink-100 dark:border-white/10 p-4 hover:border-primary/40 transition-colors"
        @click="openEdit(a)"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-body-sm font-medium truncate">{{ a.name }}</p>
            <span
              class="px-2 py-0.5 rounded-full text-caption font-medium"
              :class="a.active ? 'bg-success/10 text-success' : 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300'"
            >
              {{ a.active ? $t('automations.status.active') : $t('automations.status.inactive') }}
            </span>
          </div>
          <p class="text-caption text-ink-400 truncate mt-1">
            {{ $t(`automations.trigger.${a.trigger.type}`) }} · {{ $t('automations.runCount', { count: a.runCount }) }}
            <span v-if="a.lastRunAt"> · {{ $t('automations.lastRun', { date: formatLastRun(a.lastRunAt) }) }}</span>
          </p>
        </div>
      </button>
    </div>

    <MarketingAutomationForm v-if="showForm" :automation="editingAutomation" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
