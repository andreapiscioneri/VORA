<script setup lang="ts">
import type { Task, TaskStatus } from '~/shared/types/task'

definePageMeta({ layout: 'default' })

const { tasks, pending, error, hasMore, loadingMore, fetchTasks, loadMore, setStatus } = useTasks()
await fetchTasks()

const showForm = ref(false)
const editingTask = ref<Task | null>(null)
const defaultStatus = ref<TaskStatus>('todo')
const draggedTask = ref<Task | null>(null)

// Supports the ⌘K command palette's "New task" action (?action=new).
const route = useRoute()
if (route.query.action === 'new') showForm.value = true

const columns: { status: TaskStatus; accent: string }[] = [
  { status: 'todo', accent: 'bg-ink-300' },
  { status: 'in_progress', accent: 'bg-info' },
  { status: 'review', accent: 'bg-warning' },
  { status: 'completed', accent: 'bg-success' },
]

function tasksIn(status: TaskStatus) {
  return tasks.value.filter((t) => t.status === status)
}

function openNew(status: TaskStatus) {
  editingTask.value = null
  defaultStatus.value = status
  showForm.value = true
}

function openEdit(task: Task) {
  editingTask.value = task
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingTask.value = null
}

function onDragStart(task: Task, e: DragEvent) {
  draggedTask.value = task
  e.dataTransfer?.setData('text/plain', task.id)
}

async function onDrop(status: TaskStatus) {
  if (draggedTask.value && draggedTask.value.status !== status) {
    await setStatus(draggedTask.value, status)
  }
  draggedTask.value = null
}

function otherStatuses(status: TaskStatus) {
  return columns.map((col) => col.status).filter((s) => s !== status)
}

async function onMove(task: Task, status: TaskStatus) {
  await setStatus(task, status)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col tablet:flex-row tablet:items-center gap-4">
      <div>
        <h1 class="text-h1 font-semibold tracking-tight">{{ $t('tasks.title') }}</h1>
        <p class="text-body text-ink-400 mt-1">{{ $t('tasks.subtitle', { count: tasks.length }) }}</p>
      </div>
      <button
        class="tablet:ml-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors"
        @click="openNew('todo')"
      >
        <UiIcon name="plus" :size="16" />
        {{ $t('tasks.new') }}
      </button>
    </div>

    <div v-if="pending" class="grid grid-cols-1 tablet:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="h-40 rounded-lg bg-ink-50 dark:bg-white/5 animate-pulse" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-danger/30 bg-danger/5 p-6 text-body text-danger">
      {{ $t(error) }}
    </div>

    <div v-else-if="tasks.length === 0" class="rounded-lg border border-dashed border-ink-200 dark:border-white/10 p-12 text-center">
      <h2 class="text-h4 font-medium">{{ $t('tasks.empty.title') }}</h2>
      <p class="text-body-sm text-ink-400 mt-2">{{ $t('tasks.empty.subtitle') }}</p>
      <button class="mt-4 px-4 py-2 rounded-md text-body-sm font-medium bg-primary text-ink-950 hover:bg-primary-hover transition-colors" @click="openNew('todo')">
        {{ $t('tasks.empty.cta') }}
      </button>
    </div>

    <!-- Desktop / tablet: Kanban with drag & drop -->
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
            {{ $t(`tasks.status.${col.status}`) }}
          </span>
          <span class="text-caption text-ink-400">{{ tasksIn(col.status).length }}</span>
        </div>
        <TransitionGroup name="task-card" tag="div" class="space-y-3">
          <TasksTaskCard
            v-for="task in tasksIn(col.status)"
            :key="task.id"
            :task="task"
            :other-statuses="otherStatuses(task.status)"
            @click="openEdit(task)"
            @dragstart="onDragStart(task, $event)"
            @move="onMove(task, $event)"
          />
        </TransitionGroup>
        <button
          class="w-full flex items-center justify-center gap-2 py-2 rounded-md text-body-sm text-ink-400 hover:bg-ink-100 dark:hover:bg-white/5 transition-colors"
          @click="openNew(col.status)"
        >
          <UiIcon name="plus" :size="14" />
          {{ $t('tasks.new') }}
        </button>
      </div>
    </div>

    <!-- Mobile: grouped list -->
    <div v-if="!pending && !error && tasks.length" class="tablet:hidden space-y-6">
      <div v-for="col in columns" v-show="tasksIn(col.status).length" :key="col.status">
        <p class="flex items-center gap-2 text-body-sm font-medium mb-3">
          <span class="size-2 rounded-full" :class="col.accent" />
          {{ $t(`tasks.status.${col.status}`) }}
          <span class="text-caption text-ink-400">{{ tasksIn(col.status).length }}</span>
        </p>
        <div class="space-y-3">
          <TasksTaskCard
            v-for="task in tasksIn(col.status)"
            :key="task.id"
            :task="task"
            :other-statuses="otherStatuses(task.status)"
            @click="openEdit(task)"
            @move="onMove(task, $event)"
          />
        </div>
      </div>
    </div>

    <!-- Load-more is a flat fetch across all statuses; the Kanban simply
         re-groups whatever page of tasks is currently loaded. -->
    <div v-if="!pending && !error && hasMore" class="flex justify-center">
      <button
        class="px-4 py-2 rounded-md text-body-sm font-medium border border-ink-100 dark:border-white/10 hover:bg-ink-50 dark:hover:bg-white/5 disabled:opacity-50"
        :disabled="loadingMore"
        @click="loadMore"
      >
        {{ loadingMore ? $t('tasks.loadingMore') : $t('tasks.loadMore') }}
      </button>
    </div>

    <TasksTaskForm v-if="showForm" :task="editingTask" :default-status="defaultStatus" @close="closeForm" @saved="closeForm" @deleted="closeForm" />
  </div>
</template>

<style scoped>
.task-card-move,
.task-card-enter-active,
.task-card-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.task-card-enter-from,
.task-card-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
.task-card-leave-active {
  position: absolute;
}
</style>
