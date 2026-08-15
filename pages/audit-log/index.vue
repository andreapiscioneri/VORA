<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { entries, pending, error, fetchEntries } = useAuditLog()
await fetchEntries()

const { locale } = useI18n()

function fmt(dt: string) {
  return new Date(dt).toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' })
}

const actionStyles: Record<string, string> = {
  login: 'bg-info/10 text-info',
  logout: 'bg-ink-100 dark:bg-white/10 text-ink-400',
  'employee.create': 'bg-success/10 text-success',
  'employee.update': 'bg-info/10 text-info',
  'employee.delete': 'bg-danger/10 text-danger',
  'leave.approve': 'bg-success/10 text-success',
  'leave.reject': 'bg-danger/10 text-danger',
  'expense.approve': 'bg-success/10 text-success',
  'expense.reject': 'bg-danger/10 text-danger',
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-h1 font-semibold tracking-tight flex items-center gap-3">
        <UiIcon name="shield" :size="24" class="text-primary" />
        {{ $t('auditLog.title') }}
      </h1>
      <p class="text-body text-ink-400 mt-1">{{ $t('auditLog.subtitle') }}</p>
    </div>

    <div v-if="pending" class="space-y-2">
      <div v-for="i in 5" :key="i" class="h-12 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="entries.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <p class="text-body-sm text-ink-400">{{ $t('auditLog.empty') }}</p>
    </div>

    <div v-else class="space-y-1">
      <div v-for="e in entries" :key="e.id" class="flex items-center gap-4 rounded-lg border border-ink-100 dark:border-white/10 p-3">
        <span class="px-2 py-1 rounded-full text-caption font-medium shrink-0" :class="actionStyles[e.action] ?? 'bg-ink-100 dark:bg-white/10'">
          {{ $t(`auditLog.actions.${e.action}`) }}
        </span>
        <p class="text-body-sm flex-1">{{ e.userName }}</p>
        <p class="text-caption text-ink-400 shrink-0">{{ fmt(e.createdAt) }}</p>
      </div>
    </div>
  </div>
</template>
