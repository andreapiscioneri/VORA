<script setup lang="ts">
import type { Project, ProjectStatus } from '~/shared/types/project'

definePageMeta({ layout: 'default' })

const { projects, pending, error, hasMore, loadingMore, fetchProjects, loadMore, setStatus } = useProjects()
const { contacts, fetchContacts } = useContacts()
const { tasks, fetchTasks } = useTasks()
await Promise.all([fetchProjects(), fetchContacts(), fetchTasks()])

const { locale } = useI18n()

const view = useState<'list' | 'kanban'>('projects-view', () => 'list')
const showForm = ref(false)
const editingProject = ref<Project | null>(null)
const defaultStatus = ref<ProjectStatus>('active')
const dragged = ref<Project | null>(null)

const columns: { status: ProjectStatus; accent: string }[] = [
  { status: 'active', accent: 'bg-success' },
  { status: 'on_hold', accent: 'bg-warning' },
  { status: 'completed', accent: 'bg-info' },
  { status: 'archived', accent: 'bg-ink-300' },
]

const statusStyles: Record<string, string> = {
  active: 'bg-success/10 text-success',
  on_hold: 'bg-warning/10 text-warning',
  completed: 'bg-info/10 text-info',
  archived: 'bg-ink-100 text-ink-400 dark:bg-white/10 dark:text-paper-300',
}

function clientName(contactId: string | null) {
  if (!contactId) return ''
  const c = contacts.value.find((c) => c.id === contactId)
  return c ? `${c.firstName} ${c.lastName}` : ''
}

function taskCount(projectId: string) {
  return tasks.value.filter((t) => t.projectId === projectId).length
}

function projectsIn(status: ProjectStatus) {
  return projects.value.filter((p) => p.status === status)
}

function openNew() {
  editingProject.value = null
  defaultStatus.value = 'active'
  showForm.value = true
}

function openEdit(project: Project) {
  editingProject.value = project
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingProject.value = null
}

function onDragStart(project: Project, e: DragEvent) {
  dragged.value = project
  e.dataTransfer?.setData('text/plain', project.id)
}

async function onDrop(status: ProjectStatus) {
  if (dragged.value && dragged.value.status !== status) {
    await setStatus(dragged.value, status)
  }
  dragged.value = null
}

function formatBudget(value: number) {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('projects.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('projects.subtitle', { count: projects.length }) }}</p>
      </div>
      <div class="tablet:ml-auto flex items-center gap-3">
        <div class="hidden tablet:flex rounded-md border border-ink-100 dark:border-white/10 overflow-hidden">
          <button
            class="px-3 py-1.5 text-body-sm transition-colors"
            :class="view === 'list' ? 'bg-primary text-ink-950' : 'hover:bg-ink-50 dark:hover:bg-white/5'"
            @click="view = 'list'"
          >
            {{ $t('projects.list') }}
          </button>
          <button
            class="px-3 py-1.5 text-body-sm transition-colors"
            :class="view === 'kanban' ? 'bg-primary text-ink-950' : 'hover:bg-ink-50 dark:hover:bg-white/5'"
            @click="view = 'kanban'"
          >
            {{ $t('projects.kanban') }}
          </button>
        </div>
        <button
          class="flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
          @click="openNew"
        >
          <UiIcon name="plus" :size="16" />
          {{ $t('projects.new') }}
        </button>
      </div>
    </div>

    <div v-if="pending" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="projects.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('projects.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('projects.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew">
        {{ $t('projects.empty.cta') }}
      </button>
    </div>

    <!-- List view: table desktop/tablet, cards mobile -->
    <template v-else-if="view === 'list'">
      <div class="hidden tablet:block rounded-lg border border-ink-100 dark:border-white/10 overflow-hidden">
        <table class="w-full text-body-sm">
          <thead class="bg-ink-50 dark:bg-white/5 text-caption uppercase tracking-wide text-ink-400">
            <tr>
              <th class="text-left px-4 py-3 font-medium">{{ $t('projects.columns.name') }}</th>
              <th class="text-left px-4 py-3 font-medium">{{ $t('projects.columns.client') }}</th>
              <th class="text-left px-4 py-3 font-medium">{{ $t('projects.columns.status') }}</th>
              <th class="text-left px-4 py-3 font-medium">{{ $t('projects.columns.dueDate') }}</th>
              <th class="text-left px-4 py-3 font-medium">{{ $t('projects.columns.budget') }}</th>
              <th class="text-left px-4 py-3 font-medium">{{ $t('projects.columns.tasks') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="p in projects"
              :key="p.id"
              class="border-t border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 cursor-pointer"
              @click="openEdit(p)"
            >
              <td class="px-4 py-3 font-medium">
                <NuxtLink :to="`/projects/${p.id}`" class="hover:text-primary-600" @click.stop>{{ p.name }}</NuxtLink>
              </td>
              <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ clientName(p.contactId) || '—' }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[p.status]">
                  {{ $t(`projects.status.${p.status}`) }}
                </span>
              </td>
              <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ p.dueDate ? new Date(p.dueDate).toLocaleDateString(locale) : '—' }}</td>
              <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ p.budget ? formatBudget(p.budget) : '—' }}</td>
              <td class="px-4 py-3 text-ink-500 dark:text-paper-300">{{ taskCount(p.id) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="tablet:hidden space-y-3">
        <button
          v-for="p in projects"
          :key="p.id"
          class="w-full text-left rounded-lg border border-ink-100 dark:border-white/10 p-4"
          @click="openEdit(p)"
        >
          <p class="font-medium">{{ p.name }}</p>
          <p class="text-body-sm text-ink-400 mt-1">{{ clientName(p.contactId) || '—' }} · {{ taskCount(p.id) }} {{ $t('projects.columns.tasks').toLowerCase() }}</p>
          <span class="inline-block mt-2 px-2 py-1 rounded-full text-caption font-medium" :class="statusStyles[p.status]">
            {{ $t(`projects.status.${p.status}`) }}
          </span>
        </button>
      </div>
    </template>

    <!-- Kanban view -->
    <div v-else class="hidden tablet:grid tablet:grid-cols-4 gap-4 items-start">
      <div
        v-for="col in columns"
        :key="col.status"
        class="rounded-lg bg-ink-50/50 dark:bg-white/[0.03] p-3 space-y-3 min-h-[120px]"
        @dragover.prevent
        @drop="onDrop(col.status)"
      >
        <div class="flex items-center justify-between px-1">
          <span class="flex items-center gap-2 text-body-sm font-medium">
            <span class="size-2 rounded-full" :class="col.accent" />
            {{ $t(`projects.status.${col.status}`) }}
          </span>
          <span class="text-caption text-ink-400">{{ projectsIn(col.status).length }}</span>
        </div>
        <button
          v-for="p in projectsIn(col.status)"
          :key="p.id"
          draggable="true"
          class="w-full text-left rounded-lg border border-ink-100 dark:border-white/10 bg-surface dark:bg-white/5 p-4 space-y-2 hover:border-primary/40 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
          @click="openEdit(p)"
          @dragstart="onDragStart(p, $event)"
        >
          <p class="text-body-sm font-medium">{{ p.name }}</p>
          <p class="text-caption text-ink-400">{{ clientName(p.contactId) || '—' }} · {{ taskCount(p.id) }}</p>
        </button>
      </div>
    </div>

    <div v-if="!pending && !error && hasMore" class="flex justify-center">
      <button
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('projects.loadingMore') : $t('projects.loadMore') }}
      </button>
    </div>

    <ProjectsProjectForm v-if="showForm" :project="editingProject" :default-status="defaultStatus" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>
