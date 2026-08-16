<script setup lang="ts">
import type { Employee } from '~/shared/types/employee'

definePageMeta({ layout: 'default' })

const { employees, pending, error, fetchEmployees } = useEmployees()
await fetchEmployees()

const showForm = ref(false)
const editingEmployee = ref<Employee | null>(null)

function openNew() {
  editingEmployee.value = null
  showForm.value = true
}

function openEdit(employee: Employee) {
  editingEmployee.value = employee
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingEmployee.value = null
}

const statusStyles: Record<string, string> = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('employees.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('employees.subtitle', { count: employees.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('employees.new') }}
      </button>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="employees.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('employees.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('employees.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('employees.empty.cta') }}
      </button>
    </div>

    <div v-else class="hidden tablet:block rounded-lg border border-ink-100 dark:border-white/10 overflow-hidden">
      <table class="w-full text-body-sm">
        <thead class="bg-ink-50 dark:bg-white/5 text-caption uppercase tracking-wide text-ink-400">
          <tr>
            <th class="text-left px-4 py-3 font-medium">{{ $t('employees.columns.name') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('employees.columns.role') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('employees.columns.team') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('employees.columns.email') }}</th>
            <th class="text-left px-4 py-3 font-medium">{{ $t('employees.columns.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="e in employees"
            :key="e.id"
            class="border-t border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 cursor-pointer"
            @click="openEdit(e)"
          >
            <td class="px-4 py-3 font-medium">{{ e.firstName }} {{ e.lastName }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ e.role || '—' }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ e.team || '—' }}</td>
            <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ e.email || '—' }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[e.status]">{{ $t(`employees.status.${e.status}`) }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!pending && !error && employees.length" class="tablet:hidden space-y-3">
      <button v-for="e in employees" :key="e.id" class="w-full text-left rounded-lg border border-ink-100 dark:border-white/10 p-4" @click="openEdit(e)">
        <p class="font-medium">{{ e.firstName }} {{ e.lastName }}</p>
        <p class="text-body-sm text-ink-400 mt-1">{{ e.role || '—' }} · {{ e.team || '—' }}</p>
        <span class="inline-block mt-2 px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[e.status]">{{ $t(`employees.status.${e.status}`) }}</span>
      </button>
    </div>

    <EmployeesEmployeeForm v-if="showForm" :employee="editingEmployee" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
