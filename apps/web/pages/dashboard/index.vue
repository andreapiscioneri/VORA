<script setup lang="ts">
definePageMeta({ layout: 'default' })

const { tasks, fetchTasks } = useTasks()
const { events, fetchEvents } = useEvents()
const { appointments, fetchAppointments } = useAppointments()
const { opportunities, fetchOpportunities } = useOpportunities()
const { projects, fetchProjects } = useProjects()
const { layout, fetchLayout, updateLayout } = useDashboardLayout()

await Promise.all([fetchTasks(), fetchEvents(), fetchAppointments(), fetchOpportunities(), fetchProjects(), fetchLayout()])

const { locale, t } = useI18n()

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

// --- Customizable layout (§13: reorder, hide, add, resize, responsive) ---

const customizing = ref(false)
const draggedKey = ref<string | null>(null)

const displayWidgets = computed(() => (customizing.value ? layout.value.widgets : layout.value.widgets.filter((w) => w.visible)))

function widgetTitle(key: string) {
  const titles: Record<string, string> = {
    today: t('dashboard.today'),
    priorities: t('dashboard.tasks'),
    crm: t('dashboard.crm'),
    projects: t('dashboard.projects'),
  }
  return titles[key] ?? key
}

async function toggleVisible(key: string) {
  layout.value = { widgets: layout.value.widgets.map((w) => (w.key === key ? { ...w, visible: !w.visible } : w)) }
  await updateLayout(layout.value)
}

async function toggleSize(key: string) {
  layout.value = { widgets: layout.value.widgets.map((w) => (w.key === key ? { ...w, size: w.size === 'wide' ? 'normal' : 'wide' } : w)) }
  await updateLayout(layout.value)
}

function onDragStart(key: string, e: DragEvent) {
  draggedKey.value = key
  e.dataTransfer?.setData('text/plain', key)
}

async function onDrop(targetKey: string) {
  if (!draggedKey.value || draggedKey.value === targetKey) {
    draggedKey.value = null
    return
  }
  const widgets = [...layout.value.widgets]
  const fromIdx = widgets.findIndex((w) => w.key === draggedKey.value)
  const toIdx = widgets.findIndex((w) => w.key === targetKey)
  if (fromIdx === -1 || toIdx === -1) {
    draggedKey.value = null
    return
  }
  const [moved] = widgets.splice(fromIdx, 1)
  widgets.splice(toIdx, 0, moved)
  layout.value = { widgets }
  draggedKey.value = null
  await updateLayout(layout.value)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('dashboard.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('dashboard.subtitle') }}</p>
      </div>
      <button
        type="button"
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium transition-colors"
        :class="customizing ? 'bg-primary text-ink-950 hover:bg-primary-hover' : 'border border-ink-200 dark:border-white/10 text-ink-950 dark:text-white hover:bg-ink-50 dark:hover:bg-white/5'"
        :aria-label="customizing ? $t('dashboard.customize.exit') : $t('dashboard.customize.enter')"
        @click="customizing = !customizing"
      >
        <UiIcon name="settings" :size="16" />
        {{ customizing ? $t('dashboard.customize.exit') : $t('dashboard.customize.enter') }}
      </button>
    </div>

    <p v-if="!customizing && displayWidgets.length === 0" class="text-body-sm text-ink-400">{{ $t('dashboard.allHidden') }}</p>

    <div class="grid grid-cols-1 tablet:grid-cols-3 gap-4">
      <template v-for="widget in displayWidgets" :key="widget.key">
        <DashboardWidgetFrame
          :wide="widget.size === 'wide'"
          :customizing="customizing"
          :visible="widget.visible"
          :drag-handle-label="$t('dashboard.customize.dragHandle', { widget: widgetTitle(widget.key) })"
          :hide-label="$t('dashboard.customize.hide', { widget: widgetTitle(widget.key) })"
          :show-label="$t('dashboard.customize.show', { widget: widgetTitle(widget.key) })"
          :resize-label="$t('dashboard.customize.resize', { widget: widgetTitle(widget.key) })"
          @dragstart="onDragStart(widget.key, $event)"
          @dragover.prevent
          @drop="onDrop(widget.key)"
          @toggle-visible="toggleVisible(widget.key)"
          @toggle-size="toggleSize(widget.key)"
        >
          <!-- Today -->
          <template v-if="widget.key === 'today'">
            <h2 class="text-h4 font-medium mb-4">{{ $t('dashboard.today') }}</h2>
            <p v-if="todayItems.length === 0" class="text-body-sm text-ink-400">{{ $t('dashboard.nothingToday') }}</p>
            <ul v-else class="space-y-3">
              <li v-for="item in todayItems" :key="item.id" class="flex items-center gap-3 text-body-sm">
                <span v-if="item.time" class="text-caption text-ink-400 w-14 shrink-0">{{ formatTime(item.time) }}</span>
                <span v-else class="w-14 shrink-0" />
                <span class="truncate">{{ item.label }}</span>
              </li>
            </ul>
          </template>

          <!-- Priority tasks -->
          <template v-else-if="widget.key === 'priorities'">
            <NuxtLink to="/tasks" class="text-h4 font-medium mb-4 block hover:text-primary-600 dark:hover:text-primary">{{ $t('dashboard.tasks') }}</NuxtLink>
            <p v-if="priorityTasks.length === 0" class="text-body-sm text-ink-400">{{ $t('dashboard.noPriorityTasks') }}</p>
            <ul v-else class="space-y-3">
              <li v-for="task in priorityTasks" :key="task.id" class="flex items-center gap-2 text-body-sm">
                <UiIcon name="flag" :size="13" :class="priorityColors[task.priority]" />
                <span class="truncate">{{ task.title }}</span>
              </li>
            </ul>
          </template>

          <!-- CRM pipeline -->
          <template v-else-if="widget.key === 'crm'">
            <NuxtLink to="/crm" class="text-h4 font-medium mb-2 block hover:text-primary-600 dark:hover:text-primary">{{ $t('dashboard.crm') }}</NuxtLink>
            <p class="text-display text-h2 font-semibold">{{ openPipeline.value }}</p>
            <p class="text-body-sm text-ink-400 mt-1">{{ $t('dashboard.openOpportunities', { count: openPipeline.count }) }}</p>
          </template>

          <!-- Active projects -->
          <template v-else-if="widget.key === 'projects'">
            <NuxtLink to="/projects" class="text-h4 font-medium mb-4 block hover:text-primary-600 dark:hover:text-primary">{{ $t('dashboard.projects') }}</NuxtLink>
            <p v-if="activeProjects.length === 0" class="text-body-sm text-ink-400">{{ $t('dashboard.noActiveProjects') }}</p>
            <ul v-else class="space-y-3">
              <li v-for="p in activeProjects" :key="p.id" class="flex items-center justify-between text-body-sm">
                <span class="truncate">{{ p.name }}</span>
                <span v-if="p.dueDate" class="text-caption text-ink-400 shrink-0">{{ new Date(p.dueDate).toLocaleDateString(locale) }}</span>
              </li>
            </ul>
          </template>
        </DashboardWidgetFrame>
      </template>
    </div>
  </div>
</template>
