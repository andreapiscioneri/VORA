<script setup lang="ts">
import type { Employee } from '~/shared/types/employee'

definePageMeta({ layout: 'default' })
const router = useRouter()

const { employees, pending, error, fetchEmployees } = useEmployees()
await fetchEmployees()

interface Row { employee: Employee; depth: number }

function buildRows(list: Employee[]): Row[] {
  const byManager = new Map<string | null, Employee[]>()
  const ids = new Set(list.map((e) => e.id))
  for (const e of list) {
    const key = e.managerId && ids.has(e.managerId) ? e.managerId : null
    if (!byManager.has(key)) byManager.set(key, [])
    byManager.get(key)!.push(e)
  }

  const rows: Row[] = []
  function visit(managerId: string | null, depth: number) {
    const children = byManager.get(managerId) ?? []
    for (const child of children) {
      rows.push({ employee: child, depth })
      visit(child.id, depth + 1)
    }
  }
  visit(null, 0)
  return rows
}

const rows = computed(() => buildRows(employees.value))
</script>

<template>
  <div class="space-y-6">
    <div>
      <div class="flex items-center gap-3">
        <button
          class="shrink-0 size-9 flex items-center justify-center rounded-md hover:bg-ink-50 dark:hover:bg-white/5 text-ink-600 dark:text-paper-300"
          :aria-label="$t('common.back')"
          @click="router.back()"
        >
          <UiIcon name="arrow-left" :size="20" />
        </button>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('orgChart.title') }}</h1>
      </div>
      <p class="text-body text-ink-400 mt-1">{{ $t('orgChart.subtitle', { count: employees.length }) }}</p>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 5" :key="i" class="h-12 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="rows.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('orgChart.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('orgChart.empty.subtitle') }}</p>
    </div>

    <div v-else class="rounded-lg border border-ink-100 dark:border-white/10 divide-y divide-ink-100 dark:divide-white/10">
      <div
        v-for="row in rows"
        :key="row.employee.id"
        class="flex items-center gap-3 px-4 py-3"
        :style="{ paddingLeft: `${1 + row.depth * 1.5}rem` }"
      >
        <UiIcon v-if="row.depth > 0" name="chevron-right" :size="14" class="text-ink-300 shrink-0" />
        <div class="min-w-0">
          <p class="text-body-sm font-medium truncate">{{ row.employee.firstName }} {{ row.employee.lastName }}</p>
          <p class="text-caption text-ink-400 truncate">{{ row.employee.role || '—' }}{{ row.employee.team ? ` · ${row.employee.team}` : '' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
