<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { tasks, fetchTasks } = useTasks()
const { events, fetchEvents } = useEvents()
const { appointments, fetchAppointments } = useAppointments()
const { opportunities, fetchOpportunities } = useOpportunities()
const { projects, fetchProjects } = useProjects()

await Promise.all([fetchTasks(), fetchEvents(), fetchAppointments(), fetchOpportunities(), fetchProjects()])

const { locale } = useI18n()

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const todayItems = computed(() => {
  const today = todayIso()
  const todaysEvents = events.value.filter((e) => e.startAt.slice(0, 10) === today)
  const todaysAppts = appointments.value.filter((a) => a.startAt.slice(0, 10) === today)
  const todaysTasks = tasks.value.filter((t) => t.deadline === today && t.status !== 'completed')
  return [...todaysAppts.map((a) => ({ id: a.id, label: a.title, time: a.startAt })), ...todaysEvents.map((e) => ({ id: e.id, label: e.title, time: e.startAt }))]
    .sort((a, b) => a.time.localeCompare(b.time))
    .concat(todaysTasks.map((t) => ({ id: t.id, label: t.title, time: '' })))
})

const priorityTasks = computed(() =>
  tasks.value
    .filter((t) => t.status !== 'completed' && t.status !== 'archived' && (t.priority === 'urgent' || t.priority === 'high'))
    .slice(0, 5),
)

const openPipeline = computed(() => {
  const open = opportunities.value.filter((o) => o.stage !== 'won' && o.stage !== 'lost')
  const value = open.reduce((acc, o) => acc + o.value, 0)
  return { count: open.length, value: new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value) }
})

const activeProjects = computed(() => projects.value.filter((p) => p.status === 'active').slice(0, 5))

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
}

const priorityColors: Record<string, string> = {
  low: 'text-ink-400',
  medium: 'text-info',
  high: 'text-warning',
  urgent: 'text-danger',
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-h1 font-semibold tracking-tight">{{ $t('dashboard.title') }}</h1>
      <p class="text-body text-ink-400 mt-1">{{ $t('dashboard.subtitle') }}</p>
    </div>

    <div class="grid grid-cols-1 tablet:grid-cols-3 gap-4">
      <!-- Today -->
      <div class="tablet:col-span-2 rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-5">
        <h2 class="text-h4 font-medium mb-4">{{ $t('dashboard.today') }}</h2>
        <p v-if="todayItems.length === 0" class="text-body-sm text-ink-400">{{ $t('dashboard.nothingToday') }}</p>
        <ul v-else class="space-y-3">
          <li v-for="item in todayItems" :key="item.id" class="flex items-center gap-3 text-body-sm">
            <span v-if="item.time" class="text-caption text-ink-400 w-14 shrink-0">{{ formatTime(item.time) }}</span>
            <span v-else class="w-14 shrink-0" />
            <span class="truncate">{{ item.label }}</span>
          </li>
        </ul>
      </div>

      <!-- Priority tasks -->
      <div class="rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-5">
        <NuxtLink to="/tasks" class="text-h4 font-medium mb-4 block hover:text-primary-600 dark:hover:text-primary">{{ $t('dashboard.tasks') }}</NuxtLink>
        <p v-if="priorityTasks.length === 0" class="text-body-sm text-ink-400">{{ $t('dashboard.noPriorityTasks') }}</p>
        <ul v-else class="space-y-3">
          <li v-for="t in priorityTasks" :key="t.id" class="flex items-center gap-2 text-body-sm">
            <UiIcon name="flag" :size="13" :class="priorityColors[t.priority]" />
            <span class="truncate">{{ t.title }}</span>
          </li>
        </ul>
      </div>

      <!-- CRM pipeline -->
      <div class="rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-5">
        <NuxtLink to="/crm" class="text-h4 font-medium mb-2 block hover:text-primary-600 dark:hover:text-primary">{{ $t('dashboard.crm') }}</NuxtLink>
        <p class="text-display text-h2 font-semibold">{{ openPipeline.value }}</p>
        <p class="text-body-sm text-ink-400 mt-1">{{ $t('dashboard.openOpportunities', { count: openPipeline.count }) }}</p>
      </div>

      <!-- Active projects -->
      <div class="tablet:col-span-2 rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-5">
        <NuxtLink to="/projects" class="text-h4 font-medium mb-4 block hover:text-primary-600 dark:hover:text-primary">{{ $t('dashboard.projects') }}</NuxtLink>
        <p v-if="activeProjects.length === 0" class="text-body-sm text-ink-400">{{ $t('dashboard.noActiveProjects') }}</p>
        <ul v-else class="space-y-3">
          <li v-for="p in activeProjects" :key="p.id" class="flex items-center justify-between text-body-sm">
            <span class="truncate">{{ p.name }}</span>
            <span v-if="p.dueDate" class="text-caption text-ink-400 shrink-0">{{ new Date(p.dueDate).toLocaleDateString(locale) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
